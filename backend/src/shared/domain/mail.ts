import { DomainValidationError } from './errors/domain-validation.error';

export class Mail{
    private static readonly MAX_LENGTH = 120;

    private constructor(private readonly value: string){}

    static create(value: string): Mail{
        const normalizedValue = value.trim().toLowerCase(); // para que todos se guarden en minusculas y sin espacios

        if(!normalizedValue){
            throw new DomainValidationError('Mail cannot be empty');
        }

        if(normalizedValue.length > Mail.MAX_LENGTH){
            throw new DomainValidationError(`Mail must not exceed ${Mail.MAX_LENGTH} characters`);
        }

        // Validar el formato del correo electrónico
        const emailRegex= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(normalizedValue)){
            throw new DomainValidationError('Invalid email format');
        }

        return new Mail(normalizedValue);
    }

    getValue(): string {
        return this.value;
    }
}