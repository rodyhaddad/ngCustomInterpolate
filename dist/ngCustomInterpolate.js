/*! ngCustomInterpolate v0.0.0 14-01-2014 
The MIT License (MIT)

Copyright (c) 2013 rodyhaddad

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

!(function () {
  'use strict';

  angular.module('rh.ngCustomInterpolate', []).provider('$interpolate', ['$provide', $InterpolateProvider]);

  /**
   * @ngdoc object
   * @name ng.$interpolateProvider
   * @function
   *
   * @description
   *
   * Used for configuring the interpolation markup. Defaults to `{{` and `}}`.
   *
   * @example
   <doc:example module="customInterpolationApp">
   <doc:source>
   <script>
     var customInterpolationApp = angular.module('customInterpolationApp', []);

     customInterpolationApp.config(function($interpolateProvider) {
       $interpolateProvider.startSymbol('//');
       $interpolateProvider.endSymbol('//');
     });


     customInterpolationApp.controller('DemoController', function DemoController() {
       this.label = "This binding is brought you by // interpolation symbols.";
     });
   </script>
   <div ng-app="App" ng-controller="DemoController as demo">
     //demo.label//
   </div>
   </doc:source>
   <doc:scenario>
     it('should interpolate binding with custom symbols', function() {
       expect(binding('demo.label')).toBe('This binding is brought you by // interpolation symbols.');
     });
   </doc:scenario>
   </doc:example>
   */
  function $InterpolateProvider($provide) {
    var Suffix = 'InterpolationSyntax',
      syntaxes = this.$$syntaxes = [],
      syntaxSymbols = {};

    /**
     * @ngdoc method
     * @name ng.$interpolateProvider#startSymbol
     * @methodOf ng.$interpolateProvider
     * @description
     * Symbol to denote start of expression in the interpolated string. Defaults to `{{`.
     *
     * @param {string=} name syntax's name to set or get the start symbol for. Defaults to 'default'.
     * @param {string=} value new value to set the starting symbol to.
     * @returns {string|self} Returns the symbol when used as getter and self if used as setter.
     */
    this.startSymbol = function (name, value) {
      if (value) {
        syntaxSymbols[name].startSymbol(value);
      } else if (name) {
        if (syntaxSymbols[name]) {
          return syntaxSymbols[name].startSymbol();
        } else {
          syntaxSymbols['default'].startSymbol(name);
        }
      } else {
        return syntaxSymbols['default'].startSymbol();
      }
      return this;
    };

    /**
     * @ngdoc method
     * @name ng.$interpolateProvider#endSymbol
     * @methodOf ng.$interpolateProvider
     * @description
     * Symbol to denote the end of expression in the interpolated string. Defaults to `}}`.
     *
     * @param {string=} name syntax's name to set or get the end symbol for. Defaults to 'default'.
     * @param {string=} value new value to set the ending symbol to.
     * @returns {string|self} Returns the symbol when used as getter and self if used as setter.
     */
    this.endSymbol = function (name, value) {
      if (value) {
        syntaxSymbols[name].endSymbol(value);
      } else if (name) {
        if (syntaxSymbols[name]) {
          return syntaxSymbols[name].endSymbol();
        } else {
          syntaxSymbols['default'].endSymbol(name);
        }
      } else {
        return syntaxSymbols['default'].endSymbol();
      }
      return this;
    };

    /**
     * @ngdoc method
     * @name ng.$interpolateProvider#registerSyntax
     * @methodOf ng.$interpolateProvider
     * @description
     * Symbol to denote the end of expression in the interpolated string. Defaults to `}}`.
     *
     * @example
     <doc:example module="customInterpolationApp">
     <doc:source>
     <script>
     var customInterpolationApp = angular.module('customInterpolationApp', ['rh.ngCustomInterpolate']);

     customInterpolationApp.config(function($interpolateProvider) {
       $interpolateProvider.registerSyntax('variation', '{%', '%}', function () {
           // the parse fn, responsible for parsing anything between {% and %} in a template
           function (expression) {
             // will be watched by the appropriate $scope
             return function (scope) {
               return scope.$eval(expression, {demoText: 'This binding is brought you by ngCustomInterpolate.'})
             }
           }
         });
     });
   </script>
   <div ng-app="customInterpolationApp">
     {% demoText %}
   </div>
   </doc:source>
   <doc:scenario>
     it('should interpolate binding with custom interpolation syntaxes', function() {
       expect(binding('demoText')).toBe('This binding is brought you by ngCustomInterpolate.');
     });
   </doc:scenario>
   </doc:example>
     * @param {string} name the syntax's identifier, used by start/endSymbol methods.
     * @param {string} startSymbol symbol to denote the start of the expression.
     * @param {string} endSymbol symbol to denote the end of the expression.
     * @param {function|Array} parseFnFactory An injectable parseFn factory function,
     *    that needs to return the function responsible for parsing expressions
     * @returns {string|self} Returns the symbol when used as getter and self if used as setter.
     */
    this.registerSyntax = function (name, startSymbol, endSymbol, parseFnFactory) {

      function startSymbolFn(value) {
        if (value) {
          startSymbol = value;
          return this;
        } else {
          return startSymbol;
        }
      }

      function endSymbolFn(value) {
        if (value) {
          endSymbol = value;
          return this;
        } else {
          return endSymbol;
        }
      }

      syntaxSymbols[name] = {
        startSymbol: startSymbolFn,
        endSymbol: endSymbolFn
      };

      $provide.factory(name + Suffix, ['$injector', '$exceptionHandler',
        function ($injector, $exceptionHandler) {
          var parseFn,
            startSymbolLength = startSymbol.length,
            endSymbolLength = endSymbol.length;
          try {
            parseFn = $injector.invoke(parseFnFactory);
          } catch (e) {
            $exceptionHandler(e);
          }
          return {
            name: name,
            parseFn: parseFn,
            startSymbol: startSymbolFn,
            endSymbol: endSymbolFn,
            handle: function (parts, text) {
              var exp, startIndex, endIndex, fn,
                hasInterpolation = false,
                index = 0,
                length = text.length;

              while (index < length) {
                if (((startIndex = text.indexOf(startSymbol, index)) != -1) &&
                  ((endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) != -1)) {
                  (index != startIndex) && this.next(parts, text.substring(index, startIndex));
                  parts.push(fn = this.parseFn(exp = text.substring(startIndex + startSymbolLength, endIndex)));
                  fn.exp = exp;
                  index = endIndex + endSymbolLength;
                  hasInterpolation = true;
                } else {
                  // we did not find anything, so we have to add the remainder to the parts array
                  if (index != length) {
                    hasInterpolation = this.next(parts, text.substring(index)) || hasInterpolation;
                  }
                  index = length;
                }
              }
              return hasInterpolation;
            },
            next: function (parts, text) {
              var index = indexOf(syntaxes, name);
              if (index != -1 && syntaxes[index + 1]) {
                return $injector.get(syntaxes[index + 1] + Suffix).handle(parts, text);
              } else {
                parts.push(text);
                return false;
              }
            }
          };
        }]);


      for (var i = 0; i < syntaxes.length; i++) {
        var syntax = syntaxSymbols[syntaxes[i]];
        if (startSymbol.indexOf(syntax.startSymbol()) != -1) {
          syntaxes.splice(i, 0, name);
          break;
        }
      }
      if (i === syntaxes.length) {
        syntaxes.push(name);
      }

      return this;
    };

    this.registerSyntax('default', '{{', '}}', ['$parse', function ($parse) {
      return $parse;
    }]);

    this.$get = ['$exceptionHandler', '$sce', '$injector', function ($exceptionHandler, $sce, $injector) {
      /**
       * @ngdoc function
       * @name ng.$interpolate
       * @function
       *
       * @requires $parse
       * @requires $sce
       *
       * @description
       *
       * Compiles a string with markup into an interpolation function. This service is used by the
       * HTML {@link ng.$compile $compile} service for data binding. See
       * {@link ng.$interpolateProvider $interpolateProvider} for configuring the
       * interpolation markup.
       *
       *
       <pre>
       var $interpolate = ...; // injected
       var exp = $interpolate('Hello {{name}}!');
       expect(exp({name:'Angular'}).toEqual('Hello Angular!');
       </pre>
       *
       *
       * @param {string} text The text with markup to interpolate.
       * @param {boolean=} mustHaveExpression if set to true then the interpolation string must have
       *    embedded expression in order to return an interpolation function. Strings with no
       *    embedded expression will return null for the interpolation function.
       * @param {string=} trustedContext when provided, the returned function passes the interpolated
       *    result through {@link ng.$sce#methods_getTrusted $sce.getTrusted(interpolatedResult, trustedContext)}
       *    before returning it.  Refer to the {@link ng.$sce $sce} service that
       *    provides Strict Contextual Escaping for details.
       * @returns {function(context)} an interpolation function which is used to compute the
       *    interpolated string. The function has these parameters:
       *
       *    * `context`: an object against which any expressions embedded in the strings are evaluated
       *      against.
       *
       */
      function $interpolate(text, mustHaveExpression, trustedContext) {
        var parts = [],
          length = text.length,
          hasInterpolation,
          fn,
          concat = [];

        hasInterpolation = $injector.get(syntaxes[0] + Suffix).handle(parts, text);

        if (!(length = parts.length)) {
          // we added, nothing, must have been an empty string.
          parts.push('');
          length = 1;
        }

        // Concatenating expressions makes it hard to reason about whether some combination of
        // concatenated values are unsafe to use and could easily lead to XSS.  By requiring that a
        // single expression be used for iframe[src], object[src], etc., we ensure that the value
        // that's used is assigned or constructed by some JS code somewhere that is more testable or
        // make it obvious that you bound the value to some user controlled value.  This helps reduce
        // the load when auditing for XSS issues.
        if (trustedContext && parts.length > 1) {
          throw $interpolateMinErr('noconcat',
            "Error while interpolating: {0}\nStrict Contextual Escaping disallows " +
              "interpolations that concatenate multiple expressions when a trusted value is " +
              "required.  See http://docs.angularjs.org/api/ng.$sce", text);
        }

        if (!mustHaveExpression || hasInterpolation) {
          concat.length = length;
          fn = function (context) {
            try {
              for (var i = 0, ii = length, part; i < ii; i++) {
                if (typeof (part = parts[i]) == 'function') {
                  part = part(context);
                  if (trustedContext) {
                    part = $sce.getTrusted(trustedContext, part);
                  } else {
                    part = $sce.valueOf(part);
                  }
                  if (part === null || angular.isUndefined(part)) {
                    part = '';
                  } else if (typeof part != 'string') {
                    part = angular.toJson(part);
                  }
                }
                concat[i] = part;
              }
              return concat.join('');
            }
            catch (err) {
              var newErr = $interpolateMinErr('interr', "Can't interpolate: {0}\n{1}", text,
                err.toString());
              $exceptionHandler(newErr);
            }
          };
          fn.exp = text;
          fn.parts = parts;
          return fn;
        }
      }


      /**
       * @ngdoc method
       * @name ng.$interpolate#startSymbol
       * @methodOf ng.$interpolate
       * @description
       * Symbol to denote the start of expression in the interpolated string. Defaults to `{{`.
       *
       * Use {@link ng.$interpolateProvider#startSymbol $interpolateProvider#startSymbol} to change
       * the symbol.
       *
       * @param {string=} name syntax's name to get the start symbol for. Defaults to 'default'.
       * @returns {string} start symbol.
       */
      $interpolate.startSymbol = function (name) {
        if (!name) name = 'default';
        return syntaxSymbols[name] ?
          syntaxSymbols[name].startSymbol() :
          null;
      };


      /**
       * @ngdoc method
       * @name ng.$interpolate#endSymbol
       * @methodOf ng.$interpolate
       * @description
       * Symbol to denote the end of expression in the interpolated string. Defaults to `}}`.
       *
       * Use {@link ng.$interpolateProvider#endSymbol $interpolateProvider#endSymbol} to change
       * the symbol.
       *
       * @param {string=} name syntax's name to get the end symbol for. Defaults to 'default'.
       * @returns {string} start symbol.
       */
      $interpolate.endSymbol = function (name) {
        if (!name) name = 'default';
        return syntaxSymbols[name] ?
          syntaxSymbols[name].endSymbol() :
          null;
      };

      return $interpolate;
    }];
  }

  function $interpolateMinErr() {
    var code = arguments[0],
      prefix = '[$interpolate:' + code + '] ',
      template = arguments[1],
      templateArgs = arguments,
      stringify = function (obj) {
        if (angular.isFunction(obj)) {
          return obj.toString().replace(/ \{[\s\S]*$/, '');
        } else if (angular.isUndefined(obj)) {
          return 'undefined';
        } else if (!angular.isString(obj)) {
          return JSON.stringify(obj);
        }
        return obj;
      },
      message, i;

    message = prefix + template.replace(/\{\d+\}/g, function (match) {
      var index = +match.slice(1, -1), arg;

      if (index + 2 < templateArgs.length) {
        arg = templateArgs[index + 2];
        if (angular.isFunction(arg)) {
          return arg.toString().replace(/ ?\{[\s\S]*$/, '');
        } else if (angular.isUndefined(arg)) {
          return 'undefined';
        } else if (!angular.isString(arg)) {
          return angular.toJson(arg);
        }
        return arg;
      }
      return match;
    });

    message = message + '\nhttp://errors.angularjs.org/' + angular.version.full + '/' +
      '$interpolate/' + code;
    for (i = 2; i < arguments.length; i++) {
      message = message + (i == 2 ? '?' : '&') + 'p' + (i - 2) + '=' +
        encodeURIComponent(stringify(arguments[i]));
    }

    return new Error(message);
  }

  function indexOf(array, obj) {
    if (array.indexOf) return array.indexOf(obj);

    for (var i = 0; i < array.length; i++) {
      if (obj === array[i]) return i;
    }
    return -1;
  }

}());