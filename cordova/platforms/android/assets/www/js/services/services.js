angular.module('starter.services', [])
    .value('version', '0.1')

    .service('GeoMath', [function() {
        this.getDistanceInKm = function(location1, location2) {
            if(location1 == null || location2 == null) {
                return 0;
            }
            var R = 6371; // Radius of the earth in km
            var dLat = this.deg2rad(location2.latitude-location1.latitude);
            var dLon = this.deg2rad(location2.longitude-location1.longitude);
            var a =
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(this.deg2rad(location1.latitude)) * Math.cos(this.deg2rad(location2.latitude)) *
                            Math.sin(dLon/2) * Math.sin(dLon/2)
                ;
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c; // Distance in km
            return d;
        }

        this.deg2rad = function(deg) {
            return deg * (Math.PI/180)
        }
        
        this.timeSince = function(date) {
            if (typeof date !== 'object') {
                date = new Date(date);
            }

            var seconds = Math.floor((new Date() - date) / 1000);
            var intervalType;

            var interval = Math.floor(seconds / 31536000);
            if (interval >= 1) {
                intervalType = 'year';
            } else {
                interval = Math.floor(seconds / 2592000);
                if (interval >= 1) {
                    intervalType = 'month';
                } else {
                    interval = Math.floor(seconds / 86400);
                    if (interval >= 1) {
                        intervalType = 'day';
                    } else {
                        interval = Math.floor(seconds / 3600);
                        if (interval >= 1) {
                            intervalType = "hour";
                        } else {
                            interval = Math.floor(seconds / 60);
                            if (interval >= 1) {
                                intervalType = "minute";
                            } else {
                                intervalType = "second";
                            }
                        }
                    }
                }
            }

            if (interval > 1) {
                intervalType += 's';
            }

            if (isNaN(interval)) {
                return 'Not found';
            }

            return interval + ' ' + intervalType + ' ago';
        };
    }])

    .service('FindMyFriendsService', ['$http', function($http) {

        this._sendData = function(method, url, data) {
            return $http({
                method: method,
                url: remoteUrl + 'api/v1/' + url,
                data: data
            });
        }

        this.getAddress = function(location) {
            // https://maps.googleapis.com/maps/api/geocode/json?latlng=41.173103,-8.584697&sensor=true
            return $http({
                method: 'GET',
                url: 'https://maps.googleapis.com/maps/api/geocode/json',
                params: {'latlng': location.latitude + ',' + location.longitude,
                    'sensor': 'true' }
            });
        }

        this.getDistance = function(friendId) {
            return this._sendData('GET', 'friend/distance/' + friendId, {});
        }

        this.getMe = function () {
            return this._sendData('GET', 'me', {});
        }

        this.updateLocation = function (location) {
            return this._sendData('PUT', 'me/location', {'location': location});
        }

        this.sendShareRequest = function (friendId) {
            return this._sendData('POST', 'friend/request/' + friendId, {});
        }

        this.stopSharingLocation = function(friendId) {
            return this._sendData('POST', 'friend/status/' + friendId, {'status': 'not_sharing'});
        }

        this.startSharingLocation = function(friendId) {
            return this._sendData('POST', 'friend/status/' + friendId, {'status': 'sharing'});
        }

        this.acceptFriendRequest = function(friendId) {
            return this._sendData('POST', 'friend/status/' + friendId, {'status': 'not_sharing'});
        }

        this.blockFriend = function(friendId) {
            return this._sendData('POST', 'friend/status/' + friendId, {'status': 'blocked'});
        }

        this.unblockFriend = function(friendId) {
            return this._sendData('POST', 'friend/status/' + friendId, {'status': 'not_sharing'});
        }

        this.login = function(email, pass) {
            return this._sendData('POST', 'login/password', {'email': email, 'password': pass});
        }

        this.logout = function() {
            return this._sendData('POST', 'login/logout');
        }

        this.loginfacebook = function(token) {
            return this._sendData('POST', 'login/facebook?code=' + token, {});
        }
    }])

    .factory('MeModel', ['$http', 'FindMyFriendsService', '$filter', '$q', '$interval', 'GeoMath', function($http, FindMyFriendsService, $filter, $q, $interval, GeoMath){
        var $scope = this;
        $scope.user = null;

        return {
            getFriend: function(id) {
                if ($scope.user != undefined) {
                    var found = $filter('filter')($scope.user.friends, {'friend_id': id});
                    if (found[0] !== undefined) {
                        return found[0];
                    }
                }
            },

            getMarkers: function() {
                if ($scope.user != undefined) {
                    var markers = [];
                    angular.forEach($scope.user.friends, function(friend){
                        if (friend.user.location) {
                            // calculate distance
                            friend.user.distance = GeoMath.getDistanceInKm($scope.user.location, friend.user.location);
                            friend.user.showWindow = true;
                            friend.user.photoSmall = 'img/empty.gif';

                            // little photo for map
                            friend.user.photoThumb = friend.user.photo + '?width='+ window.devicePixelRatio*32 +'&height=' + window.devicePixelRatio*32;
                            this.push(friend.user);
                        }
                    }, markers);

                    //lets add our location to the markers
                    $scope.user.photoSmall = "img/point.png";
                    markers.push($scope.user);

                    return markers;
                }
            },

            reset: function() {
                $scope.user = null;
            },

            getMe: function() {
                var deferred = $q.defer();
                if ($scope.user) {
                    deferred.resolve($scope.user);
                }
                else {
                    FindMyFriendsService.getMe()
                        .then(function (data) {
                            // success
                            $scope.user = data.data;
                            deferred.resolve($scope.user);
                        }, function (data) {
                            // error!
                            deferred.reject(data.data);
                        });
                }
                return deferred.promise;
            }
        }
    }])

    .service('loginFacebook', ['FindMyFriendsService', '$window', '$state', function(FindMyFriendsService, $window, $state){
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
            FindMyFriendsService.loginfacebook(response.authResponse.accessToken)
                .success( function (data) {
                    if(data.status == "ok") {
                        $state.go("home");
                    }
                    return false;
                });
        };
    }])

;