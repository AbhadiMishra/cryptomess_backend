export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "SyntaxError") {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return res.status(statusCode).json({
    message: err.message || "Unexpected server error"
  });
}
