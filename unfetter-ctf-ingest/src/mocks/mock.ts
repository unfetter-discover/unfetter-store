export abstract class Mock<T> {
    public abstract mockOne(): T;

    public abstract mockMany(): T[];

    protected genNumber(): number {
        return Math.round(Math.random() * 90000);
    }
}
