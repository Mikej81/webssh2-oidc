module.exports = {
    /* if the user is not signed in, redirecting the user to the home page for front-channel requests */
    // ensureAuthenticated: function (req, res, next) {
    //     console.log("[ensureAuthenticated] Requesting Path: ", req.originalUrl);
    //     //        if (res.locals.authenticated) {
    //     if (req.isAuthenticated) {
    //         console.log("[ensureAuthenticated] State: ", req.isAuthenticated);
    //         console.log(req.isAuthenticated);
    //         next();
    //     } else {
    //         res.redirect('/oidc/login');
    //     }
    // }
    ensureAuthenticated: function (options) {
        return function (req, res, next) {
            console.log("[ensureAuthenticated]: ", req.isAuthenticated());

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