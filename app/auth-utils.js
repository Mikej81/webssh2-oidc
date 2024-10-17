// module.exports = {
//     /* if the user is not signed in, redirecting the user to the home page for front-channel requests */
//     ensureAuthenticated: function (options) {
//         return function (req, res, next) {
//             if (typeof options === 'string') {
//                 options = { redirectTo: options };
//             }
//             options = options || {};

//             const url = options.redirectTo || '/oidc/login';
//             const setReturnTo = (options.setReturnTo === undefined) ? true : options.setReturnTo;

//             if (!req.isAuthenticated || !req.isAuthenticated()) {
//                 if (setReturnTo && req.session) {
//                     console.log("setting return to: ", url);
//                     //req.session.returnTo = req.originalUrl || req.url;
//                     req.session.setReturnTo = setReturnTo;
//                 }
//                 return res.redirect(url);
//             }
//             next();
//         };
//     }
// };

function ensureAuthenticated(options = {}) {
    return function (req, res, next) {
        const originalUrl = options.originalUrl || req.originalUrl;

        // If the user is authenticated, proceed to the original requested URL if saved in the session
        if (req.isAuthenticated && req.isAuthenticated()) {
            if (req.session.returnTo) {
                const returnTo = req.session.returnTo;
                delete req.session.returnTo;  // Remove the stored URL after using it
                return res.redirect(returnTo);
            }
            return next();
        }

        // If the user is not authenticated, save the provided original URL in the session
        if (options.setReturnTo !== false && req.session) {
            req.session.returnTo = originalUrl;
        }

        // Redirect to the login page if redirectTo is specified, otherwise use default
        const redirectTo = options.redirectTo || '/oidc/login';
        return res.redirect(redirectTo);
    };
}

module.exports = { ensureAuthenticated };