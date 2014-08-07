define(["jquery", "validator", "./fnList"], function($, validator, fnList) {
    var app = angular.module('myApp', []);
    var FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/;
    app.directive('smartFloat', function() {
        return {
            require: 'ngModel',
            scope: {
                fn: '&smartFloat'
            },
            link: function(scope, elm, attrs, ctrl) {
                if (scope.fn != null && scope.fn() != null) {
                    var valid_fn = scope.fn().fn

                    ctrl.$parsers.unshift(function(viewValue) {
                        if (viewValue == undefined || viewValue.length == 0) {
                            ctrl.$setValidity('valid', true)
                            return viewValue
                        }
                        var valid_value = valid_fn(viewValue)
                        if (typeof valid_value == "boolean") {
                            ctrl.$setValidity('valid', valid_value);
                            return viewValue
                        } else {
                            ctrl.$setValidity('valid', valid_value !== undefined);
                            return valid_value;
                        }
                    });
                }
            }
        };
    });


    app.controller('FunctionGenerator', ['$scope',
        function($scope) {
            $scope.inputs = []
            $scope.fnDict = fnList.list
            $scope.fnSelected = null
            $scope.hide = true


            $scope.update = function(inputs) {
                console.log(inputs)
                $scope.fnSelected.callback(inputs)
                $scope.hide = true
            };

            $scope.reset = function() {
                $scope.user = angular.copy($scope.master);
            };

            $scope.isUnchanged = function(inputs) {
                return angular.equals(inputs, $scope.master);
            };

            $scope.cancel = function() {
                $scope.hide = true
            }

            $scope.changeSelectedFn = function(fn) {
                console.log(JSON.stringify(fn))
                if (fn != undefined && fn.argument != undefined) {
                    $scope.hide = false
                    $scope.inputs = angular.copy(fn.argument)
                    $scope.fnSelected = fn
                }
            }

        }

    ]);



    app.directive("smart", function() {
        return {
            restrict: 'A',
            link: function($scope, el, attrs) {
                el.bind("change", function(e) {
                    if ((e.srcElement || e.target).files != null)
                        $scope.fnSelected.file = (e.srcElement || e.target).files[0];
                });
            }
        }
    })

    angular.bootstrap(document, ['myApp'])



})
