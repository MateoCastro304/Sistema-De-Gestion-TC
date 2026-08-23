export class CustomerId{
    private constructor(private readonly value: string){}

    static create(value: string): CustomerId{
        if (!value.trim()){
            throw new Error('CustomerId cannot be empty');
        }
        return new CustomerId(value);
    }

    getValue(): string {
        return this.value;
    }

}