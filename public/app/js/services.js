'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1')

    .service('connection', ['$http', function($http) {

        this._sendData = function(method, url, data) {
            return $http({
               method: method,
               url: url,
               data: data
            });
        }

        this.login = function(email, pass) {
            return this._sendData('POST', 'login/password', {'email': email, 'password': pass});
        }

        this.loginfacebook = function(token) {
            return this._sendData('GET', 'login?code=' + token, {});
        }
    }])


    .service('loginFacebook', ['connection', '$window', function(connection, $window){
        var $scope = this;

        this.facebook = function() {
            $window.FB.getLoginStatus(function (response) {
                if (response.authResponse) {
                    $scope._login(response);
                } else {
                    $window.FB.login(function (response) {
                        if (response.authResponse) {
                            $scope._login(response);
                        }
                    }, {scope: 'email'});
                }
            });
        };

        this._login = function (response) {
            connection.loginfacebook(response.authResponse.accessToken)
                .success( function (data) {
                    angular.forEach(data, function (html, element) {
                        try {
                            // resposta ao teu codigo
                            console.log("fiz login!");
                        } catch (e) {
                            //
                        }
                    });
            });
        };
    }])

;