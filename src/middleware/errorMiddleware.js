// Unsupported (404) routes
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.orignalUrl}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: error.message }));
};

// Middleware to handle errors
const errorHandler = (error, req, res, next) => {
    res.writeHead(error.code || 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: error.message || 'An unknown Error Occured' }));
};

module.exports = { notFound, errorHandler };