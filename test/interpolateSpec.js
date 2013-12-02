'use strict';

describe('[with addition] $interpolate', function () {
  var $interpolateProvider, $interpolate, $parse, $iP;

  beforeEach(module('rh.ngCustomInterpolate'));
  beforeEach(module(function (_$interpolateProvider_) {
    $iP = $interpolateProvider = _$interpolateProvider_;
  }));
  beforeEach(inject(function (_$interpolate_, _$parse_) {
    $interpolate = _$interpolate_;
    $parse = _$parse_;
  }));

  function iShort(string) {
    return $interpolate(string)({a: 1})
  }

  function valueFn(value) {
    return function () {
      return value;
    }
  }

  function registerSyntax(name, startSymbol, endSymbol, parseFn) {
    $iP.registerSyntax(name, startSymbol, endSymbol, valueFn(parseFn));
  }

  describe('registerSyntax', function () {
    it('should interpolate with colliding symbols', function () {
      registerSyntax('v2', '{{{{', '}}}}', valueFn(2));
      registerSyntax('v3', '{{{', '}}}', valueFn(3));
      registerSyntax('v4', '[[[', ']]]', valueFn(4));
      registerSyntax('v5', '[[', ']]', valueFn(5));
      registerSyntax('v6', '[[[[', ']]]]', valueFn(6));

      expect(iShort('{{a}}-{{{{a}}}}-{{{a}}}-[[[a]]]-[[a]]-[[[[a]]]]')).toBe("1-2-3-4-5-6");
    });

    it('should should pass the expression and then the context to the parserFn', function () {
      var expected = null, scope = {};
      registerSyntax('variation', '[[', ']]', function (expr) {
        expect(expr).toBe(expected);
        return function (context) {
          expect(context).toBe(scope);
        };
      });

      expected = "test";
      $interpolate("[[test]]")(scope);

      expected = "test2";
      $interpolate("[[test2]]")(scope);
    });

    it('should accept the registration of new syntaxes', function () {
      registerSyntax('variation1', '[[', ']]', $parse);
      registerSyntax('variation2', '{[', ']}', $parse);
      expect(iShort('{{a}}-[[a]]-{[a]}')).toBe('1-1-1');
    });

    it('should allow default symbol changes', function () {
      function expectTestOne(value) {
        expect(iShort('{[a]}')).toBe(value);
      }

      function expectTestTwo(value) {
        expect(iShort('[[a]]')).toBe(value);
      }

      expect(iShort('{{a}}')).toBe('1');

      $iP.startSymbol('[[').endSymbol(']]');

      expectTestTwo('1');
      expect($iP.startSymbol()).toBe('[[');
      expect($iP.endSymbol()).toBe(']]');


      $iP.startSymbol('default', '{[').endSymbol('default', ']}');

      expectTestOne('1');
      expectTestTwo('[[a]]');
      expect($iP.startSymbol('default')).toBe('{[');
      expect($iP.endSymbol('default')).toBe(']}');
    });

    it('should allow custom symbol changes', function () {
      function expectTestOne(value) {
        expect(iShort('{[a]}')).toBe(value);
      }

      function expectTestTwo(value) {
        expect(iShort('[[a]]')).toBe(value);
      }

      registerSyntax('variation', '{[', ']}', $parse);
      expectTestOne('1');

      $iP.startSymbol('variation', '[[').endSymbol('variation', ']]');

      expectTestTwo('1');
      expect($iP.startSymbol('variation')).toBe('[[');
      expect($iP.endSymbol('variation')).toBe(']]');


      $iP.startSymbol('variation', '{[').endSymbol('variation', ']}');

      expectTestOne('1');
      expectTestTwo('[[a]]');
      expect($iP.startSymbol('variation')).toBe('{[');
      expect($iP.endSymbol('variation')).toBe(']}');
    });


  });

  describe('stringifications and errors', function () {
    var retValue;
    beforeEach(function () {
      retValue = undefined;
      registerSyntax('variation', '[[', ']]', function (expr) {
        return function () {
          if (expr === "err") {
            throw new Error("oops");
          }
          return retValue;
        }
      });
    });

    it('should suppress falsy objects', function () {
      retValue = undefined;
      expect($interpolate('[[retValue]]')()).toEqual('');
      retValue = null;
      expect($interpolate('[[retValue]]')()).toEqual('');
    });

    it('should jsonify objects', function () {
      retValue = {};
      expect($interpolate('[[ retValue ]]')()).toEqual('{}');
      retValue = true;
      expect($interpolate('[[ retValue ]]')()).toEqual('true');
      retValue = false;
      expect($interpolate('[[ retValue ]]')()).toEqual('false');
    });

    it('should rethrow exceptions', function () {
      expect(function () {
        $interpolate('[[err]]')();
      }).toThrowMinErr("$interpolate", "interr", "Can't interpolate: [[err]]\nError: oops");
    });

    it('should stop interpolation when encountering an exception', inject(function ($interpolate, $compile, $rootScope) {
      retValue = 2;
      var dom = angular.element('<div>[[retValue]]</div><div>[[err]]</div><div>[[1 + 2]]</div>');
      $compile(dom)($rootScope);
      expect(function () {
        $rootScope.$apply();
      }).toThrowMinErr("$interpolate", "interr", "Can't interpolate: [[err]]\nError: oops");
      expect(dom[0].innerHTML).toEqual('2');
      expect(dom[1].innerHTML).toEqual('[[err]]');
      expect(dom[2].innerHTML).toEqual('[[1 + 2]]');
    }));

  });

  describe('mustHaveExpression', function () {
    it("should return a function even if there's nothing to interpolate and mustHaveExpression isn't specified",
      function () {
        expect(typeof $interpolate('nothing')).toBe('function');
      });

    it("shouldn't return a function if there's nothing to interpolate and mustHaveExpression is true",
      function () {
        expect(typeof $interpolate('nothing', true)).toBe('undefined');
      });

    it("shouldn't return a function if there's nothing to interpolate and mustHaveExpression is false",
      function () {
        expect(typeof $interpolate('nothing', false)).toBe('function');
      })
  });

  describe('interpolating in a trusted context', function () {
    var sce, retValue;
    beforeEach(function () {
      inject(['$sce', function ($sce) {
        sce = $sce;
      }]);
    });
    beforeEach(function () {
      retValue = undefined;
      registerSyntax('variation', '[[', ']]', function (expr) {
        return function () {
          if (expr === "err") {
            throw new Error("oops");
          }
          return retValue;
        }
      });
    });

    // the angular tests are weird here. Not following them here
    it('should NOT interpolate non-trusted expressions', inject(function ($interpolate) {
      retValue = 'foo';
      expect(function () {
        $interpolate('[[retValue]]', true, sce.CSS)();
      }).toThrowMinErr(
          "$interpolate", "interr", "Can't interpolate: [[retValue]]\n" +
            "Error: [$sce:unsafe] Attempting to use an unsafe value in a safe context");
    }));

    // the angular tests are weird here. Not following them here
    it('should NOT interpolate mistyped expressions', inject(function ($interpolate) {
      retValue = sce.trustAsCss("foo");
      expect(function () {
        return $interpolate('[[retValue]]', true, sce.HTML)();
      }).toThrowMinErr(
          "$interpolate", "interr", "Can't interpolate: [[retValue]]\n" +
            "Error: [$sce:unsafe] Attempting to use an unsafe value in a safe context");
    }));

    it('should interpolate trusted expressions in a regular context', inject(function ($interpolate) {
      retValue = sce.trustAsCss("foo");
      expect($interpolate('[[retValue]]', true)()).toEqual('foo');
    }));

    it('should interpolate trusted expressions in a specific trustedContext', inject(function ($interpolate) {
      retValue = sce.trustAsCss("foo");
      expect($interpolate('[[retValue]]', true, sce.CSS)()).toEqual('foo');
    }));

    // The concatenation of trusted values does not necessarily result in a trusted value.  (For
    // instance, you can construct evil JS code by putting together pieces of JS strings that are by
    // themselves safe to execute in isolation.)
    it('should NOT interpolate trusted expressions with multiple parts', inject(function ($interpolate) {
      //retValue = sce.trustAsCss("foo");
      retValue = sce.trustAsCss("bar");
      expect(function () {
        return $interpolate('[[foo]][[bar]]', true, sce.CSS)();
      }).toThrowMinErr(
          "$interpolate", "noconcat", "Error while interpolating: [[foo]][[bar]]\n" +
            "Strict Contextual Escaping disallows interpolations that concatenate multiple " +
            "expressions when a trusted value is required.  See " +
            "http://docs.angularjs.org/api/ng.$sce");
    }));
  });


  describe('parseBindings', function () {
    beforeEach(function () {
      registerSyntax('variation', '[[', ']]', $parse);
    });

    it('should Parse Text With No Bindings', inject(function ($interpolate) {
      var parts = $interpolate("a").parts;
      expect(parts.length).toEqual(1);
      expect(parts[0]).toEqual("a");
    }));

    it('should Parse Empty Text', inject(function ($interpolate) {
      var parts = $interpolate("").parts;
      expect(parts.length).toEqual(1);
      expect(parts[0]).toEqual("");
    }));

    it('should Parse Inner Binding', inject(function ($interpolate) {
      var parts = $interpolate("a[[b]]C").parts;
      expect(parts.length).toEqual(3);
      expect(parts[0]).toEqual("a");
      expect(parts[1].exp).toEqual("b");
      expect(parts[1]({b: 123})).toEqual(123);
      expect(parts[2]).toEqual("C");
    }));

    it('should Parse Ending Binding', inject(function ($interpolate) {
      var parts = $interpolate("a[[b]]").parts;
      expect(parts.length).toEqual(2);
      expect(parts[0]).toEqual("a");
      expect(parts[1].exp).toEqual("b");
      expect(parts[1]({b: 123})).toEqual(123);
    }));

    it('should Parse Begging Binding', inject(function ($interpolate) {
      var parts = $interpolate("[[b]]c").parts;
      expect(parts.length).toEqual(2);
      expect(parts[0].exp).toEqual("b");
      expect(parts[1]).toEqual("c");
    }));

    it('should Parse Loan Binding', inject(function ($interpolate) {
      var parts = $interpolate("[[b]]").parts;
      expect(parts.length).toEqual(1);
      expect(parts[0].exp).toEqual("b");
    }));

    it('should Parse Two Bindings', inject(function ($interpolate) {
      var parts = $interpolate("[[b]][[c]]").parts;
      expect(parts.length).toEqual(2);
      expect(parts[0].exp).toEqual("b");
      expect(parts[1].exp).toEqual("c");
    }));

    it('should Parse Two Bindings With Text In Middle', inject(function ($interpolate) {
      var parts = $interpolate("[[b]]x[[c]]").parts;
      expect(parts.length).toEqual(3);
      expect(parts[0].exp).toEqual("b");
      expect(parts[1]).toEqual("x");
      expect(parts[2].exp).toEqual("c");
    }));

    it('should Parse Multiline', inject(function ($interpolate) {
      var parts = $interpolate('"X\nY[[A\n+B]]C\nD"').parts;
      expect(parts.length).toEqual(3);
      expect(parts[0]).toEqual('"X\nY');
      expect(parts[1].exp).toEqual('A\n+B');
      expect(parts[2]).toEqual('C\nD"');
    }));

    it('should have parseFn in the .parts array', function () {
      registerSyntax('variation2', '{[', ']}', function (expr) {
        return angular.noop;
      });

      var parts = $interpolate('a{[b]}c').parts;
      expect(parts).toEqual(['a', angular.noop, 'c']);
    })
  });

  describe('isTrustedContext', function () {
    beforeEach(function () {
      registerSyntax('variation', '[[', ']]', function (expr) {
        return function () {
          if (expr === "err") {
            throw new Error("oops");
          }
          return expr;
        }
      });
    });

    it('should NOT interpolate a multi-part expression when isTrustedContext is true', inject(function ($interpolate) {
      var isTrustedContext = true;
      expect(function () {
        $interpolate('constant/[[var]]', true, isTrustedContext);
      }).toThrowMinErr(
          "$interpolate", "noconcat", "Error while interpolating: constant/[[var]]\nStrict " +
            "Contextual Escaping disallows interpolations that concatenate multiple expressions " +
            "when a trusted value is required.  See http://docs.angularjs.org/api/ng.$sce");
      expect(function () {
        $interpolate('[[foo]]{{baz}}[[bar]]', true, isTrustedContext);
      }).toThrowMinErr(
          "$interpolate", "noconcat", "Error while interpolating: [[foo]]{{baz}}[[bar]]\nStrict " +
            "Contextual Escaping disallows interpolations that concatenate multiple expressions " +
            "when a trusted value is required.  See http://docs.angularjs.org/api/ng.$sce");
    }));

    it('should interpolate a multi-part expression when isTrustedContext is false', inject(function ($interpolate) {
      expect($interpolate('some/[[id]]')()).toEqual('some/id');
      expect($interpolate('[[foo]]{{baz}}[[bar]]')({baz: 'baz'})).toEqual('foobazbar');
    }));
  });


  describe('startSymbol', function () {

    describe('[default]', function () {
      it('should be write/read using provider', function () {
        expect($iP.startSymbol()).toBe('{{');
        expect($iP.startSymbol('default')).toBe('{{');

        $iP.startSymbol('[[');
        expect($iP.startSymbol()).toBe('[[');
        expect($iP.startSymbol('default')).toBe('[[');

        $iP.startSymbol('default', '{[');
        expect($iP.startSymbol()).toBe('{[');
        expect($iP.startSymbol('default')).toBe('{[');
      });

      it('should read from service', function () {
        expect($interpolate.startSymbol()).toBe('{{');
        expect($interpolate.startSymbol('default')).toBe('{{');

        $iP.startSymbol('[[');
        expect($interpolate.startSymbol()).toBe('[[');
        expect($interpolate.startSymbol('default')).toBe('[[');
      });

    });

    describe('[custom]', function () {
      it('should be write/read using provider', function () {
        registerSyntax('custom', '((', '))', angular.noop);
        $iP.startSymbol('custom', '[[');
        expect($iP.startSymbol('custom')).toBe('[[');

        $iP.startSymbol('custom', '{[');
        expect($iP.startSymbol('custom')).toBe('{[');
      });

      it('should read from service', function () {
        registerSyntax('custom', '((', '))', angular.noop);

        expect($interpolate.startSymbol('custom')).toBe('((');

        $iP.startSymbol('custom', '[[');
        expect($interpolate.startSymbol('custom')).toBe('[[');
      });

      it('should return null if the syntax doesn\'t exist', function () {
        expect($interpolate.startSymbol('custom')).toBe(null);
      })
    });

  });

  describe('endSymbol', function () {

    describe('[default]', function () {
      it('should be write/read using provider', function () {
        expect($iP.endSymbol()).toBe('}}');
        expect($iP.endSymbol('default')).toBe('}}');

        $iP.endSymbol(']]');
        expect($iP.endSymbol()).toBe(']]');
        expect($iP.endSymbol('default')).toBe(']]');

        $iP.endSymbol('default', ']}');
        expect($iP.endSymbol()).toBe(']}');
        expect($iP.endSymbol('default')).toBe(']}');
      });

      it('should read from service', function () {
        expect($interpolate.endSymbol()).toBe('}}');
        expect($interpolate.endSymbol('default')).toBe('}}');

        $iP.endSymbol(']]');
        expect($interpolate.endSymbol()).toBe(']]');
        expect($interpolate.endSymbol('default')).toBe(']]');
      });
    });

    describe('[custom]', function () {
      it('should be write/read using provider', function () {
        registerSyntax('custom', '((', '))', angular.noop);
        $iP.endSymbol('custom', ']]');
        expect($iP.endSymbol('custom')).toBe(']]');

        $iP.endSymbol('custom', ']}');
        expect($iP.endSymbol('custom')).toBe(']}');
      });

      it('should read from service', function () {
        registerSyntax('custom', '((', '))', angular.noop);

        expect($interpolate.endSymbol('custom')).toBe('))');

        $iP.endSymbol('custom', ']]');
        expect($interpolate.endSymbol('custom')).toBe(']]');
      });

      it('should return null if the syntax doesn\'t exist', function () {
        expect($interpolate.endSymbol('custom')).toBe(null);
      })
    });

  });

});