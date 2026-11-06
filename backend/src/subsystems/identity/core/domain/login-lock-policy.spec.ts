import {
  LoginAttemptRecord,
  LoginLockTier,
  MAX_LOCK_SECONDS,
  applyFailure,
  assertUsableTier,
  remainingLockSeconds,
} from './login-lock-policy';

/**
 * Nivel principal (usuario + IP): bloquea en cada 5.º fallo consecutivo y
 * escala 90 s, 5 min, 15 min, 30 min, 60 min. Los fallos decaen tras 15 min
 * de calma. Está escrito acá y no se lee del entorno: estos tests prueban la
 * mecánica de la escala y tienen que significar lo mismo con cualquier
 * configuración.
 */
const TIER: LoginLockTier = {
  scope: 'username+ip',
  threshold: 5,
  windowSeconds: 15 * 60,
  ladderSeconds: [90, 5 * 60, 15 * 60, 30 * 60, 60 * 60],
};

const T0 = new Date('2026-10-11T12:00:00.000Z');

function at(secondsFromT0: number): Date {
  return new Date(T0.getTime() + secondsFromT0 * 1000);
}

/** Repite `count` fallos con un segundo de diferencia, desde T0. */
function failTimes(count: number): LoginAttemptRecord | null {
  let record: LoginAttemptRecord | null = null;
  for (let i = 0; i < count; i += 1) {
    record = applyFailure(TIER, record, at(i));
  }
  return record;
}

describe('remainingLockSeconds', () => {
  it('reports no lock for a key with nothing on record', () => {
    expect(remainingLockSeconds(null, T0)).toBe(0);
  });

  it('reports no lock while the failure count is below the threshold', () => {
    expect(remainingLockSeconds(failTimes(4), at(4))).toBe(0);
  });

  it('rounds up, so a key with milliseconds left never reports zero', () => {
    // Un `Retry-After: 0` se lee como "adelante" e invita a un reintento que la
    // política volvería a rechazar.
    const record: LoginAttemptRecord = {
      failures: 5,
      lastFailedAt: T0,
      lockedUntil: new Date(T0.getTime() + 400),
    };
    expect(remainingLockSeconds(record, T0)).toBe(1);
  });

  it('reports no lock once the lock has elapsed', () => {
    const record = failTimes(5);
    expect(remainingLockSeconds(record, at(4 + 90))).toBe(0);
  });
});

describe('applyFailure', () => {
  it('starts counting from one for a key with nothing on record', () => {
    const record = applyFailure(TIER, null, T0);

    expect(record.failures).toBe(1);
    expect(record.lockedUntil).toBeNull();
    expect(record.lastFailedAt).toEqual(T0);
  });

  it('locks for the first ladder step on reaching the threshold', () => {
    const record = failTimes(5);

    expect(record?.failures).toBe(5);
    // El 5.º fallo es en T0+4s: 90 s de bloqueo desde ahí.
    expect(remainingLockSeconds(record, at(4))).toBe(90);
  });

  it('does not lock on the attempts between two thresholds', () => {
    // Los fallos 6 a 9 conservan el bloqueo vencido del nivel 1 pero no lo
    // extienden.
    let record = failTimes(5);

    for (let i = 1; i <= 4; i += 1) {
      record = applyFailure(TIER, record, at(100 + i));
      expect(remainingLockSeconds(record, at(100 + i))).toBe(0);
    }

    expect(record?.failures).toBe(9);
  });

  it('escalates one ladder step per threshold crossed', () => {
    let record = failTimes(5);
    const locks: number[] = [remainingLockSeconds(record, at(4))];

    // Cada ronda: se espera el bloqueo vigente y se queman cinco fallos más.
    let t = 100;
    for (let level = 2; level <= 5; level += 1) {
      for (let i = 0; i < 5; i += 1) {
        t += 1;
        record = applyFailure(TIER, record, at(t));
      }
      locks.push(remainingLockSeconds(record, at(t)));
      t += locks[locks.length - 1];
    }

    expect(locks).toEqual([90, 300, 900, 1_800, 3_600]);
  });

  it('caps the escalation at the last ladder step', () => {
    // El tope evita que la política se vuelva un ataque de denegación de
    // servicio contra la cuenta que protege: quien conozca un username podría
    // bloquearlo para siempre.
    let record = failTimes(5);
    let t = 100;

    for (let level = 2; level <= 8; level += 1) {
      for (let i = 0; i < 5; i += 1) {
        t += 1;
        record = applyFailure(TIER, record, at(t));
      }
      t += remainingLockSeconds(record, at(t));
    }

    expect(record?.failures).toBe(40);
    expect(remainingLockSeconds(record, at(t - 3_600))).toBe(3_600);
  });

  it('decays the count after a quiet window', () => {
    const record = applyFailure(TIER, failTimes(4), at(4 + 901));

    expect(record.failures).toBe(1);
    expect(record.lockedUntil).toBeNull();
  });

  it('measures the decay window from the end of the lock, not the last failure', () => {
    // Guarda contra una escala imposible de subir. Con el bloqueo de nivel 5
    // (3600 s) mayor que la ventana (900 s), medir el decaimiento desde
    // `lastFailedAt` reiniciaría la cuenta cada vez y ninguna clave llegaría
    // al nivel 2.
    const locked: LoginAttemptRecord = {
      failures: 5,
      lastFailedAt: T0,
      lockedUntil: at(3_600),
    };

    // Un segundo después de que cae el bloqueo: muy pasada la ventana desde el
    // último fallo, pero casi nada desde que la clave quedó usable.
    const record = applyFailure(TIER, locked, at(3_601));

    expect(record.failures).toBe(6);
  });

  it('keeps an elapsed lock on record so the next level can be reached', () => {
    const record = applyFailure(TIER, failTimes(5), at(200));

    expect(record.failures).toBe(6);
    expect(record.lockedUntil).not.toBeNull();
    expect(remainingLockSeconds(record, at(200))).toBe(0);
  });

  it('honours a tier that locks on every failure', () => {
    const strict: LoginLockTier = { ...TIER, threshold: 1 };
    const record = applyFailure(strict, null, T0);

    expect(remainingLockSeconds(record, T0)).toBe(90);
  });
});

/**
 * Límites de lo que se puede configurar. Como la política viene de
 * `LOGIN_LOCK_*`, un error de tipeo es la falla realista; el adaptador corre
 * estas validaciones al arrancar para que salga como error de arranque con el
 * nombre de la variable, y no como un bloqueo raro semanas después.
 */
describe('assertUsableTier', () => {
  it('accepts the recommended primary tier', () => {
    expect(() => assertUsableTier(TIER, 'LOGIN_LOCK')).not.toThrow();
  });

  it('accepts a single-step ladder, which the username backstop tier uses', () => {
    const backstop: LoginLockTier = {
      scope: 'username',
      threshold: 25,
      windowSeconds: 60 * 60,
      ladderSeconds: [15 * 60],
    };

    expect(() => assertUsableTier(backstop, 'LOGIN_LOCK_USER')).not.toThrow();
  });

  it('rejects an empty ladder, which would never lock anything', () => {
    expect(() => assertUsableTier({ ...TIER, ladderSeconds: [] }, 'LOGIN_LOCK')).toThrow(/LOGIN_LOCK_LADDER/);
  });

  it('rejects a ladder above the ceiling, since the last step repeats forever', () => {
    expect(() => assertUsableTier({ ...TIER, ladderSeconds: [90, MAX_LOCK_SECONDS + 1] }, 'LOGIN_LOCK')).toThrow(
      /tope/,
    );
  });

  it('rejects a ladder that goes backwards', () => {
    expect(() => assertUsableTier({ ...TIER, ladderSeconds: [300, 90] }, 'LOGIN_LOCK')).toThrow(/decrecer/);
  });

  it('rejects a threshold below one', () => {
    expect(() => assertUsableTier({ ...TIER, threshold: 0 }, 'LOGIN_LOCK')).toThrow(/LOGIN_LOCK_THRESHOLD/);
  });

  it('names the offending variable, so the error is actionable', () => {
    expect(() => assertUsableTier({ ...TIER, ladderSeconds: [] }, 'LOGIN_LOCK_USER')).toThrow(
      /LOGIN_LOCK_USER_LADDER/,
    );
  });
});
