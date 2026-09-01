export const returnError = (res, error) => {
    const status = error?.status || 500;
    return res.status(status).json({
        success: false,
        message: error?.msg || 'Internal server error',
    });
};