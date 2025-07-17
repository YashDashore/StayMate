//  Wrapper function - so calling db again & again. Don't have to write same try catch block again and again

const AsyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        next(error)
    }
};

export { AsyncHandler };
