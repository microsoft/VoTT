import { Deferred } from "./deferred";

describe("Deferred", () => {
    it("resolve without result", (done) => {
        const deferred = new Deferred();
        const promise = deferred.promise;

        const thenCallback = jest.fn();
        const catchCallback = jest.fn();

        promise
            .then(thenCallback)
            .catch(catchCallback);

        deferred.resolve();

        setImmediate(() => {
            expect(thenCallback).toBeCalled();
            expect(catchCallback).not.toBeCalled();
            done();
        });
    });

    it("reject without error", (done) => {
        const deferred = new Deferred();
        const promise = deferred.promise;

        const thenCallback = jest.fn();
        const catchCallback = jest.fn();

        promise
            .then(thenCallback)
            .catch(catchCallback);

        deferred.reject();

        setImmediate(() => {
            expect(thenCallback).not.toBeCalled();
            expect(catchCallback).toBeCalled();
            done();
        });
    });

    it("resolve with result", (done) => {
        const deferred = new Deferred();
        const promise = deferred.promise;

        const thenCallback = jest.fn();
        const catchCallback = jest.fn();

        promise
            .then(thenCallback)
            .catch(catchCallback);

        const expected = "result";
        deferred.resolve(expected);

        setImmediate(() => {
            expect(thenCallback).toBeCalledWith(expected);
            expect(catchCallback).not.toBeCalled();
            done();
        });
    });

    it("reject with error", (done) => {
        const deferred = new Deferred();
        const promise = deferred.promise;

        const thenCallback = jest.fn();
        const catchCallback = jest.fn();

        promise
            .then(thenCallback)
            .catch(catchCallback);

        const error = new Error("Some error");
        deferred.reject(error);

        setImmediate(() => {
            expect(thenCallback).not.toBeCalled();
            expect(catchCallback).toBeCalledWith(error);
            done();
        });
    });
});
