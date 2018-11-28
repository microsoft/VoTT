import { Deferred } from './deferred';

describe('Deferred', () => {
    it('resolve without result', (done) => {
        const deferred = new Deferred();
        const promise = deferred.promise;

        const thenCallback = jest.fn();
        const catchCallback = jest.fn();

        promise
            .then(thenCallback)
            .catch(catchCallback);

        deferred.resolve();

        setTimeout(() => {
            expect(thenCallback).toBeCalled();
            expect(catchCallback).not.toBeCalled();
            done();
        }, 100);
    });

    it('reject without error', (done) => {
        const deferred = new Deferred();
        const promise = deferred.promise;

        const thenCallback = jest.fn();
        const catchCallback = jest.fn();

        promise
            .then(thenCallback)
            .catch(catchCallback);

        deferred.reject();

        setTimeout(() => {
            expect(thenCallback).not.toBeCalled();
            expect(catchCallback).toBeCalled();
            done();
        }, 100);
    });

    it('resolve with result', (done) => {
        const deferred = new Deferred();
        const promise = deferred.promise;

        const thenCallback = jest.fn();
        const catchCallback = jest.fn();

        promise
            .then(thenCallback)
            .catch(catchCallback);

        const expected = 'result';
        deferred.resolve(expected);

        setTimeout(() => {
            expect(thenCallback).toBeCalledWith(expected);
            expect(catchCallback).not.toBeCalled();
            done();
        }, 100);
    });

    it('reject with error', (done) => {
        const deferred = new Deferred();
        const promise = deferred.promise;

        const thenCallback = jest.fn();
        const catchCallback = jest.fn();

        promise
            .then(thenCallback)
            .catch(catchCallback);

        const error = new Error('Some error');
        deferred.reject(error);

        setTimeout(() => {
            expect(thenCallback).not.toBeCalled();
            expect(catchCallback).toBeCalledWith(error);
            done();
        }, 100);
    });
});