module.exports = function() {
  /**
   * Forwarded Headers checks for HTTP Headers and updates Host values
   *
   * @param {Object} req Express Request
   * @param {Object} res Express Response
   * @param {function} next Next function
   * @return {undefined}
   */
  return function forwardedHeaders(req, res, next) {
    const forwardedHost = req.get('X-Forwarded-Host');
    if (forwardedHost) {
      req.headers.host = forwardedHost;
    }

    next();
  };
};
