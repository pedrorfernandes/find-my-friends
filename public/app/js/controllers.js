'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('LoginController', ['$scope', 'connection', 'loginFacebook', function($scope, connection, loginFacebook) {
        $scope.email = '';
        $scope.password = '';

        $scope.login = function() {
            connection.login($scope.email, $scope.password)
                .success(function(response) {
                    console.log(response + '->' + $scope.email);
                });
        }



        $scope.facebook = function() {
            loginFacebook.facebook();
        }
  }])





  .controller('MyCtrl2', [function() {

  }]);