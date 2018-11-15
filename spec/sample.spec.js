describe('Sample Test', () => {
    const testObject = {
        foo: 'bar'
    }

    beforeAll(() => {
        //console.log('beforeAll runs before all tests within the current describe block');
    });

    beforeEach(() => {
        //console.log('beforeEach runs before each test wihtin the current describe block');
    });

    afterAll(() => {
        //console.log('afterAll runs after all tests within the current describe block');
    });

    afterEach(() => {
        //console.log('afterEach runs after each test wihtin the current describe block');
    });

    it('is defined', () => {
        expect(testObject).toBeDefined();
    });

    it('has property foo', () => {
        const expected = 'bar';
        expect(testObject.foo).toEqual(expected);
    });

    it('is an async test', (done) => {
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve(), 250)
        })

        promise.then(done);
    });
});