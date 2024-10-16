module.exports = {
    /* if the user is not signed in, redirecting the user to the home page for front-channel requests */
    ensureAuthenticated: function (options) {
        return function (req, res, next) {
            if (typeof options === 'string') {
                options = { redirectTo: options };
            }
            options = options || {};

            const url = options.redirectTo || '/oidc/login';
            const setReturnTo = (options.setReturnTo === undefined) ? true : options.setReturnTo;

            if (!req.isAuthenticated || !req.isAuthenticated()) {
                if (setReturnTo && req.session) {
                    req.session.returnTo = req.originalUrl || req.url;
                }
                return res.redirect(url);
            }
            next();
        };
    }
};