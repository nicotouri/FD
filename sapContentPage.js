/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
(function () {
  "use strict";
  var e = {
    BasePath: "https://s4cloudlpiz4055ed249.cn1.platform.sapcloud.cn/elastic-access/sap/lpi/",
    ResultHeadersPath: "ResultHeaders",
    CORS: true,
    CSRFTokenHeader: "",
    AppendScenarioParameter: "_L54AD1F204_",
    Tenant: "https://my314233.s4hana.ondemand.com",
    Version: "26.0.2",
  };
  var t = {
    getConfig: function (i) {
      if (i) {
        var n = t.Setting.get(i, "lpi-base-path"),
          a = t.Setting.get(i, "lpi-tenant");
        if (n && a) {
          return {
            BasePath: n,
            ResultHeadersPath: "",
            CORS: true,
            CSRFTokenHeader: "",
            AppendScenarioParameter: "_L54AD1F204_",
            Tenant: a,
            Version: e.Version,
          };
        }
      }
      return e;
    },
    initialize: function () {
      if (this.isInitializing() || this.isInitialized()) {
        return;
      }
      this.reset();
      var e = this.getPages(),
        t;
      for (t = 0; t < e.length; t++) {
        this.ContentPage.prepare(e[t]);
      }
      this.Request.fetchToken(e, this.handleFetchTokenResponse.bind(this));
    },
    handleFetchTokenResponse: function (e, i) {
      var n;
      if (i) {
        for (n = 0; n < e.length; n++) {
          this.Result.sendOpen(e[n], this.handleOpenResponse.bind(this));
        }
      } else {
        for (n = 0; n < e.length; n++) {
          t.ContentPage.toggleErrorMessage(e[n], true);
        }
      }
    },
    handleOpenResponse: function (e, i) {
      if (t.Request.isErrorResponse(i)) {
        t.ContentPage.toggleErrorMessage(e, true);
      } else {
        this.ContentPage.finishLoading(e, i);
      }
      e.sapCpInitializing = false;
      e.sapCpInitialized = true;
    },
    isInitializing: function () {
      var e = this.getPages(),
        t;
      for (t = 0; t < e.length; t++) {
        if (e[t].sapCpInitializing) {
          return true;
        }
      }
      return false;
    },
    isInitialized: function () {
      var e = this.getPages(),
        t;
      for (t = 0; t < e.length; t++) {
        if (!e[t].sapCpInitialized) {
          return false;
        }
      }
      return true;
    },
    getPages: function () {
      return t.Node.getAllWithClassName(document, "sapCpContentPage");
    },
    reset: function () {
      var e = this.getPages(),
        t,
        i;
      for (t = 0; t < e.length; t++) {
        i = e[t];
        delete i.sapCpInitializing;
        delete i.sapCpInitialized;
        delete i.sapCpCSRFToken;
      }
    },
    ContentPage: {
      prepare: function (e) {
        if (e.sapCpInitializing || e.sapCpInitialized) {
          return;
        }
        e.sapCpInitializing = true;
        this.checkVersion(e);
        this.prepareWidgets(e);
        this.appendOutboundIdToLinks(e);
        t.Event.registerListener(
          e,
          "submit",
          this.handleSubmitEvent.bind(this)
        );
      },
      checkVersion: function (e) {
        var i = t.Setting.get(e, "version"),
          n = t.getConfig(e);
        if (i > n.Version) {
          t.Console.warn(
            "You are using an outdated version of the landing page script"
          );
        }
      },
      prepareWidgets: function (e) {
        var i = this.getWidgets(e),
          n;
        for (n = 0; n < i.length; n++) {
          t.Widget.prepare(i[n]);
        }
      },
      getWidgets: function (e) {
        return t.Node.getAllWithClassName(e, "sapCpWidget");
      },
      findSurroundingLandingPageOrReturnForm: function (e) {
        return t.Util.findParentByClassName(e, "sapLandingPage") || e;
      },
      appendOutboundIdToLinks: function (e) {
        var i = t.Util.getOutboundId();
        if (!i) {
          return;
        }
        var n = t.ContentPage.findSurroundingLandingPageOrReturnForm(e),
          a = n.getElementsByTagName("a"),
          s;
        for (s = 0; s < a.length; s++) {
          a[s].href = t.Util.appendOutboundId(a[s].href, i);
        }
      },
      checkMissingMandatoryFieldsLabel: function (e) {
        var i = t.Util.findParentByClassName(e, "sapCpContentPage"),
          n = t.Node.getAllWithClassName(i, "sapCpWidgetMandatoryMissing"),
          a = n.length > 0;
        t.ContentPage.toggleMissingMandatoryField(i, a);
      },
      finishLoading: function (e, t) {
        if (
          t &&
          t.ContactPersonalizationData &&
          t.ContactPersonalizationData.results
        ) {
          this.processPersonalizationData(
            e,
            t.ContactPersonalizationData.results
          );
        }
        this.processDataAndPrepareProgresProfileWidget(e);
        this.toggleLoading(e, false);
      },
      processPersonalizationData: function (e, i) {
        var n,
          a = this.getWidgets(e),
          s,
          r;
        for (r = 0; r < i.length; r++) {
          n = i[r];
          s = t.Util.findWidgetByKey(a, n.WidgetKeyHash);
          if (s) {
            t.Widget.applyPersonalization(s, n.Value);
          }
        }
      },
      processDataAndPrepareProgresProfileWidget: function (e) {
        var i = this.getWidgets(e),
          n,
          a,
          s = t.Setting.get(e, "progres-max"),
          r = parseInt(s, 10);
        if (t.Setting.get(e, "prefill-data") !== "true") {
          return;
        }
        if (t.Setting.get(e, "progres-enabled") !== "true") {
          return;
        }
        var o = [];
        for (n = 0; n < i.length; n++) {
          a = t.Widget.addProgressiveEnabledWidgets(i[n]);
          if (a !== null && a !== undefined) {
            o.push(a);
          }
        }
        o.sort(function (e, t) {
          return e.widgetPrio - t.widgetPrio;
        });
        for (var l = 0; l < r && l < o.length; l++) {
          if (t.CSS.hasClass(o[l].widget, "sapCpWidgetMandatory")) {
            if (t.Node.getFirstWithClassName(o[l].widget, "sapCpInput")) {
              t.Node.getFirstWithClassName(
                o[l].widget,
                "sapCpInput"
              ).setAttribute("required", "required");
            }
            if (t.Node.getFirstWithClassName(o[l].widget, "sapCpDropDown")) {
              Array.from(
                t.Node.getAllWithClassName(o[l].widget, "sapCpDropDown")
              ).forEach(function (e) {
                e.setAttribute("required", "required");
              });
            }
            if (t.Node.getFirstWithClassName(o[l].widget, "sapCpCheckBox")) {
              t.Node.getFirstWithClassName(
                o[l].widget,
                "sapCpCheckBox"
              ).setAttribute("required", "required");
            }
          }
          t.CSS.toggleClass(o[l].widget, "sapCpWidgetHidden", false);
        }
      },
      handleSubmitEvent: function (e) {
        if (e.preventDefault) {
          e.preventDefault();
        }
      },
      collectAnswers: function (e, i, n) {
        var a = this.getWidgets(e),
          s,
          r = [],
          o = 0,
          l = false,
          d = false,
          u;
        for (u = 0; u < a.length; u++) {
          s = a[u];
          t.Widget.collectAnswer(s, i, function (e) {
            if (e) {
              r.push(e);
            } else if (e === false && !t.CSS.hasClass(s, "sapCpWidgetHidden")) {
              l = true;
            } else if (e === null) {
              d = true;
            }
            o++;
            if (o === a.length) {
              if (l || d) {
                n(false);
              } else {
                n(r);
              }
            }
          });
        }
      },
      toggleLoading: function (e, i) {
        t.CSS.toggleClass(e, "sapCpContentPageLoading", i);
      },
      toggleMissingMandatoryField: function (e, i) {
        t.CSS.toggleClass(e, "sapCpMissingMandatoryField", i);
      },
      toggleInvalid: function (e, i) {
        t.CSS.toggleClass(e, "sapCpContentPageInvalid", i);
      },
      toggleErrorMessage: function (e, i) {
        t.CSS.toggleClass(e, "sapCpSubmitError", i);
      },
      toggleSuccessMessage: function (e, i) {
        t.CSS.toggleClass(e, "sapCpSubmitCompleted", i);
      },
      isProductiveTestMode: function (e) {
        var i = t.Setting.get(e, "test-mode"),
          n = t.Setting.get(e, "productive");
        return i && n;
      },
      setErrorMessage: function (e, i) {
        var n = t.Node.getFirstWithClassName(e, "sapCpErrorMessageText");
        if (n) {
          n.sapCpErrorMessage = n.sapCpErrorMessage || n.textContent;
          n.textContent = i || n.sapCpErrorMessage;
        }
      },
    },
    Layout: {},
    Widget: {
      prepare: function (e) {
        if (this.isInputWidget(e)) {
          t.InputWidget.prepare(e);
        } else if (this.isCheckBoxWidget(e)) {
          t.CheckBoxWidget.prepare(e);
        } else if (this.isDownloadWidget(e)) {
          t.DownloadWidget.prepare(e);
        } else if (this.isButtonWidget(e)) {
          t.ButtonWidget.prepare(e);
        } else if (this.isInteractionWidget(e)) {
          t.InteractionWidget.prepare(e);
        }
      },
      applyPersonalization: function (e, i) {
        if (this.isInputWidget(e)) {
          t.InputWidget.applyPersonalization(e, i);
        } else if (this.isCheckBoxWidget(e)) {
          t.CheckBoxWidget.applyPersonalization(e, i);
        }
      },
      collectAnswer: function (e, i, n) {
        var a = function (i) {
          if (i === false) {
            t.Widget.toggleMissingMandatory(e, true);
            t.Widget.toggleInvalid(e, false);
          } else if (i === null) {
            t.Widget.toggleMissingMandatory(e, false);
            t.Widget.toggleInvalid(e, true);
          } else {
            t.Widget.toggleMissingMandatory(e, false);
            t.Widget.toggleInvalid(e, false);
          }
          n(i);
        };
        if (this.isTextWidget(e)) {
          n();
        } else if (this.isInputWidget(e)) {
          t.InputWidget.collectAnswer(e, a);
        } else if (this.isNoteWidget(e)) {
          t.NoteWidget.collectAnswer(e, a);
        } else if (this.isCheckBoxWidget(e)) {
          t.CheckBoxWidget.collectAnswer(e, a);
        } else if (this.isDownloadWidget(e)) {
          t.DownloadWidget.collectAnswer(e, a);
        } else if (this.isButtonWidget(e)) {
          t.ButtonWidget.collectAnswer(e, i, a);
        } else if (this.isInteractionWidget(e)) {
          t.InteractionWidget.collectAnswer(e, a);
        } else if (this.isCaptchaWidget(e)) {
          t.CaptchaWidget.collectAnswer(e, a);
        }
      },
      addProgressiveEnabledWidgets: function (e) {
        var i = e;
        if (!this.isInputWidget(e)) {
          return null;
        }
        if (t.Setting.get(i, "wProgres-enabled") === "false") {
          return null;
        }
        var n = t.Node.getFirstWithClassName(i, "sapCpInput");
        if (t.Node.getFirstWithClassName(i, "sapCpDropDown")) {
          n = t.Node.getFirstWithClassName(i, "sapCpDropDown");
        }
        if (t.Node.getFirstWithClassName(i, "sapCpCheckBox")) {
          n = t.Node.getFirstWithClassName(i, "sapCpCheckBox");
        }
        if (n && !n.value) {
          return { widgetPrio: t.Setting.get(i, "wProgres-prio"), widget: i };
        }
        return null;
      },
      isMandatory: function (e) {
        return t.CSS.hasClass(e, "sapCpWidgetMandatory");
      },
      isTextWidget: function (e) {
        return t.CSS.hasClass(e, "sapCpTextWidget");
      },
      isInputWidget: function (e) {
        return t.CSS.hasClass(e, "sapCpInputWidget");
      },
      isNoteWidget: function (e) {
        return t.CSS.hasClass(e, "sapCpNoteWidget");
      },
      isCheckBoxWidget: function (e) {
        return t.CSS.hasClass(e, "sapCpCheckBoxWidget");
      },
      isDownloadWidget: function (e) {
        return t.CSS.hasClass(e, "sapCpDownloadWidget");
      },
      isButtonWidget: function (e) {
        return t.CSS.hasClass(e, "sapCpButtonWidget");
      },
      isInteractionWidget: function (e) {
        return t.CSS.hasClass(e, "sapCpInteractionWidget");
      },
      isCaptchaWidget: function (e) {
        return t.CSS.hasClass(e, "sapCpCaptchaWidget");
      },
      toggleMissingMandatory: function (e, i) {
        t.CSS.toggleClass(e, "sapCpWidgetMandatoryMissing", i);
      },
      toggleInvalid: function (e, i) {
        t.CSS.toggleClass(e, "sapCpWidgetInvalid", i);
      },
    },
    InputWidget: {
      prepare: function (e) {
        var i = t.Widget.isMandatory(e),
          n,
          a,
          s,
          r;
        a = e.getElementsByTagName("select");
        for (r = 0; r < a.length; r++) {
          t.Event.registerListener(
            a[r],
            "change",
            this.handleDropDownChangeEvent.bind(this)
          );
        }
        s = t.Node.getFirstWithClassName(e, "sapCpDatePicker");
        if (s) {
          this.prepareDatePicker(s);
        }
        if (t.CSS.hasClass(e, "sapCpContactAttribute-COUNTRY")) {
          this.prepareCountryNode(e);
        }
        if (t.CSS.hasClass(e, "sapCpContactAttribute-REGION")) {
          this.prepareRegionNode(e);
        }
        if (t.Setting.get(e, "wProgres-enabled") === "true") {
          t.CSS.toggleClass(e, "sapCpWidgetHidden", true);
          if (t.CSS.hasClass(e, "sapCpWidgetMandatory")) {
            if (t.Node.getFirstWithClassName(e, "sapCpInput")) {
              t.Node.getFirstWithClassName(e, "sapCpInput").removeAttribute(
                "required"
              );
            }
            if (t.Node.getFirstWithClassName(e, "sapCpDropDown")) {
              var o = t.Node.getAllWithClassName(e, "sapCpDropDown");
              Array.from(o).forEach(this.appendChildNodes);
            }
            if (t.Node.getFirstWithClassName(e, "sapCpCheckBox")) {
              t.Node.getFirstWithClassName(e, "sapCpCheckBox").removeAttribute(
                "required"
              );
            }
          }
        }
        if (!i) {
          return;
        }
        n = e.getElementsByTagName("input");
        if (n[0]) {
          t.Event.registerListener(
            n[0],
            "focusout",
            this.handleInputFocusOutEvent.bind(this)
          );
        }
      },
      prepareDatePicker: function (e) {
        var i = t.Node.getAllWithClassName(e, "sapCpDropDown"),
          n,
          a;
        for (a = 0; a < i.length; a++) {
          n = i[a];
          if (t.CSS.hasClass(n, "sapCpDatePickerDay")) {
            this.prepareDatePickerDayDropDown(n);
          } else if (t.CSS.hasClass(n, "sapCpDatePickerMonth")) {
            t.Event.registerListener(
              n,
              "change",
              this.handleDatePickerDropDownChangeEvent.bind(this)
            );
          } else if (t.CSS.hasClass(n, "sapCpDatePickerYear")) {
            this.prepareDatePickerYearDropDown(n);
            t.Event.registerListener(
              n,
              "change",
              this.handleDatePickerDropDownChangeEvent.bind(this)
            );
          }
        }
      },
      prepareDatePickerDayDropDown: function (e) {
        var t;
        for (t = 1; t <= 31; t++) {
          this.addDatePickerDropDownOption(e, t);
        }
      },
      prepareDatePickerYearDropDown: function (e) {
        var i = t.Setting.get(e, "dropdowntype"),
          n = i.split("-"),
          a,
          s,
          r = new Date(),
          o = r.getFullYear(),
          l,
          d;
        if (n.length === 4) {
          a = parseInt(n[2], 10) || 0;
          s = parseInt(n[3], 10) || 0;
        }
        if (a > 0) {
          for (d = a; d > 0; d--) {
            l = o + d;
            this.addDatePickerDropDownOption(e, l);
          }
        }
        this.addDatePickerDropDownOption(e, o);
        if (s > 0) {
          for (d = 1; d <= s; d++) {
            l = o - d;
            this.addDatePickerDropDownOption(e, l);
          }
        }
      },
      prepareCountryNode: function (e) {
        t.Event.registerListener(
          e,
          "change",
          this.handleCountryDropDownChangeEvent.bind(this)
        );
      },
      prepareRegionNode: function (e) {
        var t = e.getElementsByTagName("select"),
          i,
          n;
        for (i = 0; i < t.length; i++) {
          n = this.findSelectedCountryCode(e);
          if (n) {
            this.updateRegionValues(t[i], n);
            t[i].disabled = false;
          } else {
            t[i].disabled = true;
          }
        }
      },
      findSelectedCountryCode: function (e) {
        var i,
          n = t.Util.findSiblingNodeByClassName(
            e,
            "sapCpContactAttribute-COUNTRY"
          ),
          a = n.getElementsByTagName("select")[0],
          s = a.options;
        for (i = 0; i < s.length; i++) {
          if (s[i].selected && s[i].value) {
            return s[i].value;
          }
        }
        return null;
      },
      applyPersonalization: function (e, i) {
        var n = t.Node.getFirstWithClassName(e, "sapCpInput"),
          a = t.Node.getFirstWithClassName(e, "sapCpCheckBox"),
          s = t.Node.getFirstWithClassName(e, "sapCpDatePicker"),
          r = t.Node.getFirstWithClassName(e, "sapCpDropDown"),
          o;
        if (!i) {
          return;
        }
        if (n) {
          n.value = i;
        } else if (a) {
          o = a.getElementsByTagName("input");
          if (o[0]) {
            o[0].checked = !!i;
          }
        } else if (s) {
          if (i !== "00000000") {
            var l = t.Node.getFirstWithClassName(s, "sapCpDatePickerYear"),
              d = t.Node.getFirstWithClassName(s, "sapCpDatePickerMonth"),
              u = t.Node.getFirstWithClassName(s, "sapCpDatePickerDay");
            if (l) {
              l.value = i.substring(0, 4);
            }
            if (d) {
              d.value = i.substring(4, 6);
            }
            if (u) {
              u.value = i.substring(6, 8);
            }
          }
        } else if (r) {
          var g = r.parentElement.parentElement.classList.contains(
            "sapCpContactAttribute-COUNTRY"
          );
          if (g) {
            var p = t.Util.findSiblingNodeByClassName(
              r,
              "sapCpContactAttribute-REGION"
            );
          }
          if (g && p) {
            r.value = i;
            this.updateDropDownValue(r);
            this.prepareRegionNode(p);
          } else {
            r.value = i;
            this.updateDropDownValue(r);
          }
        }
      },
      appendChildNodes: function (e) {
        var i = t.Node.createEmptyOptionElement();
        if (e.querySelectorAll("option[selected = 'selected']").length === 0) {
          e.appendChild(i);
        }
        e.removeAttribute("required");
      },
      handleInputFocusOutEvent: function (e) {
        var i = e.target,
          n = t.Util.findParentByClassName(i, "sapCpInputWidget");
        if (i.value) {
          t.Widget.toggleMissingMandatory(n, false);
        }
        t.ContentPage.checkMissingMandatoryFieldsLabel(n);
      },
      handleDropDownChangeEvent: function (e) {
        var t = e.target;
        this.updateDropDownValue(t);
      },
      handleDatePickerDropDownChangeEvent: function (e) {
        var t = e.target,
          i = t.parentNode;
        this.updateDatePickerValues(i);
      },
      handleCountryDropDownChangeEvent: function (e) {
        var i = this.findSelectedCountryCode(e.srcElement),
          n = t.Util.findSiblingNodeByClassName(
            e.srcElement,
            "sapCpContactAttribute-REGION"
          ),
          a;
        if (n) {
          a = n.getElementsByTagName("select")[0];
          this.updateRegionValues(a, i);
          a.disabled = !i;
        }
      },
      createOptionElement: function (e) {
        var t;
        if (e) {
          t = document.createElement("option");
          t.label = e.label;
          t.value = e.value;
          t.selected = e.selected;
          t.text = e.text;
          return t;
        }
        return null;
      },
      updateRegionValues: function (e, t) {
        var i, n, a;
        if (!e.aBufferedRegions) {
          e.aBufferedRegions = [];
          for (i = 0; i < e.options.length; i++) {
            a = e.options[i];
            n = {};
            n.label = a.label;
            n.value = a.value;
            n.selected = a.selected;
            n.text = a.text;
            e.aBufferedRegions.push(n);
          }
        }
        e.innerHTML = "";
        if (t) {
          for (i = 0; i < e.aBufferedRegions.length; i++) {
            n = e.aBufferedRegions[i];
            if (n.value.indexOf(t) === 0 || !n.value) {
              if (n.selected && n.value) {
                n.selected = false;
              }
              if (!t && !n.value) {
                n.selected = true;
              } else {
                n.selected = false;
              }
              a = this.createOptionElement(n);
              e.add(a);
            }
          }
        } else {
          for (i = 0; i < e.aBufferedRegions.length; i++) {
            n = e.aBufferedRegions[i];
            if (!n.value) {
              a = this.createOptionElement(n);
              e.add(a);
            }
          }
        }
      },
      updateDropDownValue: function (e) {
        t.CSS.toggleClass(e, "sapCpDropDownPlaceholder", !e.value);
      },
      updateDatePickerValues: function (e) {
        var i = t.Node.getFirstWithClassName(e, "sapCpDatePickerDay"),
          n = t.Node.getFirstWithClassName(e, "sapCpDatePickerMonth"),
          a = t.Node.getFirstWithClassName(e, "sapCpDatePickerYear");
        if (!i || !n || !a) {
          return;
        }
        var s = i.selectedOptions[0].value,
          r = n.selectedOptions[0].value,
          o = a.selectedOptions[0].value,
          l = parseInt(s, 10) || 0,
          d = parseInt(r, 10) || 0,
          u = parseInt(o, 10) || 0,
          g = new Date(u, d, 0),
          p = g.getDate(),
          f = i.options.length,
          c,
          C;
        if (l > p) {
          i.selectedIndex = p.toString();
        }
        if (f > p + 1) {
          for (C = f; C > p + 1; C--) {
            i.remove(C - 1);
          }
        } else if (f < p + 1) {
          for (C = f; C < p + 1; C++) {
            c = C;
            this.addDatePickerDropDownOption(i, c);
          }
        }
      },
      addDatePickerDropDownOption: function (e, t) {
        var i = t.toString(),
          n;
        if (t < 10) {
          i = "0" + i;
        }
        n = new Option(i, i);
        e.add(n);
      },
      checkValidity: function (e) {
        var t;
        var i = true;
        var n = "";
        if (Array.isArray(e) && e.length === 3) {
          var a = e[0].value,
            s = e[1].value,
            r = e[2].value;
          i =
            (a === "" && s === "" && r === "") ||
            (a !== "" && s !== "" && r !== "");
          if (!i) {
            n = e[2].getAttribute("data-sap-cp-validationMessage");
          }
        }
        if (e.type === "text" && e.pattern !== null && e.pattern !== "") {
          if (e.value) {
            t = new RegExp("^" + e.pattern + "$");
            i = t.test(e.value);
            if (!i) {
              n = e.getAttribute("data-sap-cp-validationMessage");
            }
          }
        }
        if (e.type === "email") {
          if (e.value) {
            t = new RegExp(
              /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
            i = t.test(e.value);
            if (!i) {
              n = e.getAttribute("data-sap-cp-validationMessage");
            }
          }
        }
        if (e.type === "tel") {
          if (e.value) {
            t = new RegExp("^\\+(?:[0-9] ?){6,28}[0-9]$");
            i = t.test(e.value);
            if (!i) {
              n = e.getAttribute("data-sap-cp-validationMessage");
            }
          }
        }
        if (Array.isArray(e) && e.length === 3) {
          if (e[2].setCustomValidity) {
            e[2].setCustomValidity(n);
          }
          for (var o = 0; o < e.length; o++) {
            e[o].title = n;
          }
        } else {
          if (e.setCustomValidity) {
            e.setCustomValidity(n);
            e.title = n;
          } else {
            e.title = n;
          }
        }
        return i;
      },
      collectAnswer: function (e, i) {
        var n = t.Widget.isMandatory(e),
          a = t.Node.getFirstWithClassName(e, "sapCpInput"),
          s = t.Node.getFirstWithClassName(e, "sapCpCheckBox"),
          r = t.Node.getFirstWithClassName(e, "sapCpDatePicker"),
          o = t.Node.getFirstWithClassName(e, "sapCpDropDown"),
          l,
          d,
          u;
        if (a) {
          u = !this.checkValidity(a);
          d = a.value;
        } else if (s) {
          l = s.getElementsByTagName("input");
          if (l[0]) {
            d = l[0].checked ? "X" : "";
          }
        } else if (r) {
          var g = t.Node.getFirstWithClassName(r, "sapCpDatePickerYear"),
            p = t.Node.getFirstWithClassName(r, "sapCpDatePickerMonth"),
            f = t.Node.getFirstWithClassName(r, "sapCpDatePickerDay");
          if (g && p && f) {
            d = g.value + p.value + f.value;
          }
          u = !this.checkValidity([g, p, f]);
          if (!/^[0-9]{8}$/.test(d)) {
            d = "";
          }
        } else if (o) {
          d = o.value;
        }
        if (n && !d) {
          i(false);
        } else if (u) {
          i(null);
        } else {
          var c = {
            WidgetKeyHash: t.Setting.get(e, "key"),
            WidgetValueKeyHash: "",
            Value: d,
          };
          i(c);
        }
      },
    },
    CheckBoxWidget: {
      prepare: function (e) {
        var i = t.Widget.isMandatory(e),
          n;
        if (!i) {
          return;
        }
        n = e.getElementsByTagName("input")[0];
        if (n) {
          t.Event.registerListener(
            n,
            "focusout",
            this.handleCheckBoxFocusOutEvent.bind(this)
          );
        }
      },
      applyPersonalization: function (e, t) {
        var i;
        i = e.getElementsByTagName("input")[0];
        if (i) {
          i.checked = i.checked || !!t;
        }
      },
      handleCheckBoxFocusOutEvent: function (e) {
        var i = e.target,
          n = t.Util.findParentByClassName(i, "sapCpCheckBoxWidget");
        if (i.checked) {
          t.Widget.toggleMissingMandatory(n, false);
        }
        t.ContentPage.checkMissingMandatoryFieldsLabel(n);
      },
      collectAnswer: function (e, i) {
        var n = t.Widget.isMandatory(e),
          a = e.getElementsByTagName("input")[0],
          s = false;
        if (a) {
          s = a.checked;
        }
        if (n && !s) {
          i(false);
        } else {
          var r = {
            WidgetKeyHash: t.Setting.get(e, "key"),
            WidgetValueKeyHash: "",
            Value: s ? "X" : "",
          };
          i(r);
        }
      },
    },
    NoteWidget: {
      collectAnswer: function (e, i) {
        var n = t.Widget.isMandatory(e),
          a = e.getElementsByTagName("textarea"),
          s;
        if (a[0]) {
          s = a[0].value;
        }
        if (n && !s) {
          i(false);
        } else {
          var r = {
            WidgetKeyHash: t.Setting.get(e, "key"),
            WidgetValueKeyHash: "",
            Value: s,
          };
          i(r);
        }
      },
    },
    DownloadWidget: {
      prepare: function (e) {
        var i = t.Widget.isMandatory(e),
          n;
        if (!i) {
          return;
        }
        n = e.getElementsByTagName("input");
        if (n[0]) {
          t.Event.registerListener(
            n[0],
            "focusout",
            this.handleCheckBoxFocusOutEvent.bind(this)
          );
        }
      },
      handleCheckBoxFocusOutEvent: function (e) {
        var i = e.target,
          n = t.Util.findParentByClassName(i, "sapCpDownloadWidget");
        if (i.checked) {
          t.Widget.toggleMissingMandatory(n, false);
        }
        t.ContentPage.checkMissingMandatoryFieldsLabel(n);
      },
      collectAnswer: function (e, i) {
        var n = t.Widget.isMandatory(e),
          a = e.getElementsByTagName("input"),
          s = false;
        if (a[0]) {
          s = a[0].checked;
        }
        if (n && !s) {
          i(false);
        } else {
          var r = {
            WidgetKeyHash: t.Setting.get(e, "key"),
            WidgetValueKeyHash: "",
            Value: s ? "X" : "",
          };
          i(r);
        }
      },
    },
    InteractionWidget: {
      prepare: function (e) {
        var i = t.Widget.isMandatory(e),
          n;
        if (!i) {
          return;
        }
        n = e.getElementsByTagName("input");
        if (n[0]) {
          t.Event.registerListener(
            n[0],
            "focusout",
            this.handleCheckBoxFocusOutEvent.bind(this)
          );
        }
      },
      handleCheckBoxFocusOutEvent: function (e) {
        var i = e.target,
          n = t.Util.findParentByClassName(i, "sapCpInteractionWidget");
        if (i.checked) {
          t.Widget.toggleMissingMandatory(n, false);
        }
        t.ContentPage.checkMissingMandatoryFieldsLabel(n);
      },
      collectAnswer: function (e, i) {
        var n = t.Widget.isMandatory(e),
          a = e.getElementsByTagName("input"),
          s = false;
        if (a[0]) {
          s = a[0].checked;
        }
        if (n && !s) {
          i(false);
        } else {
          var r = {
            WidgetKeyHash: t.Setting.get(e, "key"),
            WidgetValueKeyHash: "",
            Value: s ? "X" : "",
          };
          i(r);
        }
      },
    },
    CaptchaWidget: {
      collectAnswer: function (e, i) {
        t.CaptchaWidget.fetchCaptchaToken(e, function (n) {
          var a = {
            WidgetKeyHash: t.Setting.get(e, "key"),
            WidgetValueKeyHash: "",
            Value: t.CaptchaWidget.buildAnswerValue(e, n),
          };
          i(a);
        });
      },
      fetchCaptchaToken: function (e, i) {
        var n = t.Setting.get(e, "captcha-sitekey"),
          a = t.Setting.get(e, "captcha-action");
        window.grecaptcha.ready(function () {
          window.grecaptcha.execute(n, { action: a }).then(function (e) {
            i(e);
          });
        });
      },
      buildAnswerValue: function (e, i) {
        var n = t.Setting.get(e, "captcha-key");
        if (!i) {
          return "";
        }
        if (!n) {
          return i;
        }
        return "SAP_CAPTCHA_TOKEN:::" + n + ":::" + i;
      },
    },
    ButtonWidget: {
      prepare: function (e) {
        var i;
        i = e.getElementsByTagName("button");
        if (i[0]) {
          t.Event.registerListener(
            i[0],
            "click",
            this.handleButtonClickEvent.bind(this)
          );
        }
      },
      handleButtonClickEvent: function (e) {
        var i = e.target,
          n = t.Util.findParentByClassName(i, "sapCpButtonWidget");
        if (e.preventDefault) {
          e.preventDefault();
        }
        t.Result.sendSubmit(n);
      },
      collectAnswer: function (e, i, n) {
        if (e === i) {
          var a = {
            WidgetKeyHash: t.Setting.get(e, "key"),
            WidgetValueKeyHash: "",
            Value: "X",
          };
          n(a);
        } else {
          n();
        }
      },
      performFollowUpAction: function (e, i, n) {
        var a = t.Setting.get(e, "follow-up-action");
        if ((!a || a === t.Constants.FollowUpAction.FollowUpPage) && n) {
          this.openFollowUpPage(n);
        } else {
          t.ContentPage.toggleSuccessMessage(i, true);
        }
      },
      openFollowUpPage: function (e) {
        var i = t.Util.appendOutboundId(e);
        t.Util.openPage(window, i);
      },
      toggleDownloadLinkVisible: function (e, i) {
        t.CSS.toggleClass(e, "sapCpButtonWidgetDownloadLinkVisible", i);
      },
      toggleLoading: function (e, i) {
        var n =
            typeof i === "undefined"
              ? !t.CSS.hasClass(e, "sapCpButtonWidgetLoading")
              : i,
          a = e.getElementsByTagName("button"),
          s;
        t.CSS.toggleClass(e, "sapCpButtonWidgetLoading", n);
        for (s = 0; s < a.length; s++) {
          if (n) {
            a[s].setAttribute("disabled", "disabled");
          } else {
            a[s].removeAttribute("disabled");
          }
        }
      },
    },
    Result: {
      sendOpen: function (e, i) {
        var n = t.Setting.get(e, "prefill-data") === "true",
          a = t.Result.buildOpen(e, n);
        t.Request.postResult(e, a, function (t) {
          i(e, t);
        });
        if (!n) {
          i(e, true);
        }
      },
      sendSubmit: function (e) {
        var i = t.Util.findParentByClassName(e, "sapCpContentPage");
        t.Result.buildSubmit(i, e, function (n) {
          var a = true;
          t.ContentPage.toggleErrorMessage(i, false);
          t.ContentPage.toggleSuccessMessage(i, false);
          if (i.checkValidity) {
            a = i.checkValidity();
            t.ContentPage.toggleInvalid(i, !a);
            if (i.reportValidity) {
              i.reportValidity();
            }
          }
          if (a && n) {
            t.ContentPage.toggleMissingMandatoryField(i, false);
            t.ButtonWidget.toggleLoading(e, true);
            t.Request.postResult(i, n, function (n) {
              t.Result.handleSubmitResponse(n, i, e);
              t.ButtonWidget.toggleLoading(e, false);
            });
          } else {
            t.ContentPage.toggleMissingMandatoryField(i, true);
          }
        });
      },
      buildOpen: function (e, t) {
        var i = this.buildResult(e, "OPEN");
        if (t) {
          i.ContactPersonalizationData = [];
        }
        return i;
      },
      buildSubmit: function (e, i, n) {
        var a, s;
        a = this.buildResult(e, "SUBMIT");
        t.ContentPage.collectAnswers(e, i, function (i) {
          s = !i;
          t.ContentPage.toggleMissingMandatoryField(e, s);
          if (s) {
            n(null);
            return;
          }
          a.Answers = i;
          a.ResultValues = [];
          n(a);
        });
      },
      buildResult: function (e, i) {
        var n = e.getElementsByClassName("sapCpLayout")[0];
        var a = {
          ResultEvent: i,
          ContentPageKeyHash: t.Setting.get(e, "key"),
          LayoutKeyHash: t.Setting.get(n, "key"),
          Url: t.Util.getCurrentUrl(),
        };
        if (t.Setting.get(e, "lpkey")) {
          a.LandingPageKeyHash = t.Setting.get(e, "lpkey");
        }
        if (t.ContentPage.isProductiveTestMode(e)) {
          a.ProductiveTestMode = true;
        }
        var s = t.Util.getOutboundId();
        if (s) {
          a.OutboundId = s;
        }
        var r = t.Util.getCampaignId();
        if (r) {
          a.CampaignId = r;
        }
        return a;
      },
      handleSubmitResponse: function (e, i, n) {
        if (t.Request.isErrorResponse(e)) {
          var a =
            (e && e.error && e.error.message && e.error.message.value) ||
            "Error";
          if (this.checkMessagePresentable(e)) {
            t.ContentPage.setErrorMessage(i, a);
          } else {
            t.ContentPage.setErrorMessage(i);
          }
          t.Console.warn(a);
          t.ContentPage.toggleErrorMessage(i, true);
          return;
        }
        if (e.ResultValues && e.ResultValues.results) {
          this.handleResultValues(e.ResultValues.results, n);
        }
        t.ButtonWidget.performFollowUpAction(n, i, e.FollowUpPage);
      },
      checkMessagePresentable: function (e) {
        var t = false;
        var i;
        if (e && e.error && e.error.code) {
          if (e.error.code.indexOf("HPA_COMMON/") === 0) {
            i = e.error.code.substring(11);
            if (i === "415" || (i >= 420 && i <= 428)) {
              t = true;
            }
          }
          if (e.error.code.indexOf("CUAN_CONTENT_PAGE/") === 0) {
            t = true;
          }
        }
        return t;
      },
      handleResultValues: function (e, i) {
        var n, a;
        for (a = 0; a < e.length; a++) {
          n = e[a];
          if (n.WidgetValueName === t.Constants.WidgetValueName.DownloadURI) {
            this.handleDownloadURI(n, i);
          }
        }
      },
      handleDownloadURI: function (e, i) {
        var n = e.Value,
          a,
          s,
          r,
          o;
        t.Util.openDownload(window, n);
        a = t.Node.getAllWithClassName(i, "sapCpLink");
        for (o = 0; o < a.length; o++) {
          s = a[o];
          r = t.Setting.get(s, "download-key");
          if (r === e.WidgetKeyHash) {
            s.href = n;
            t.ButtonWidget.toggleDownloadLinkVisible(s, true);
            break;
          }
        }
      },
    },
    Request: {
      buildRequest: function (i, n, a) {
        var s = n,
          r = this.appendScenarioParameter(a, i),
          o = new XMLHttpRequest();
        if (e.CORS && !("withCredentials" in o)) {
          if (typeof XDomainRequest === "function") {
            o = new XDomainRequest();
            if (s === "HEAD") {
              s = "GET";
            }
          } else {
            t.Console.warn(
              "Cross-Domain requests are not supported in your browser."
            );
            return null;
          }
        }
        o.open(s, r, true);
        this.setRequestHeaders(o, i);
        o.withCredentials = true;
        return o;
      },
      appendScenarioParameter: function (e, i) {
        var n = e,
          a = t.getConfig(i);
        if (a.AppendScenarioParameter) {
          var s = "scenario=LPI",
            r = "tenant=" + a.Tenant,
            o = [s, r].join("&");
          n += "?" + a.AppendScenarioParameter + "=" + btoa(o);
        }
        return n;
      },
      setRequestHeaders: function (e, i) {
        if (e.setRequestHeader) {
          var n = t.getConfig(i);
          e.setRequestHeader(
            "Content-Type",
            "application/json; charset=utf-8 "
          );
          e.setRequestHeader("Accept", "application/json");
          if (n.CSRFTokenHeader) {
            e.setRequestHeader(n.CSRFTokenHeader, i.sapCpCSRFToken || "Fetch");
          }
          return true;
        }
        return false;
      },
      send: function (e, t, i, n) {
        if (e instanceof XMLHttpRequest) {
          e.onreadystatechange = function () {
            if (
              (e.DONE && e.readyState !== e.DONE) ||
              e.readyState !== XMLHttpRequest.DONE
            ) {
              return;
            }
            if (e.status >= 200 && e.status < 300) {
              i(e);
            } else {
              n(e);
            }
          };
        } else {
          e.onload = function () {
            i(e);
          };
          e.onerror = function () {
            n(e);
          };
          e.onprogress = function () {};
          e.ontimeout = function () {};
        }
        if (t) {
          e.send(JSON.stringify(t));
        } else {
          e.send();
        }
      },
      fetchToken: function (e, i, n) {
        var a = n ? "GET" : "HEAD",
          s,
          r,
          o,
          l;
        for (s = 0; s < e.length; s++) {
          r = e[s];
          o = t.getConfig(r);
          l = this.buildRequest(r, a, o.BasePath);
          if (!o.CSRFTokenHeader) {
            i([r], true);
            return;
          }
          this.send(
            l,
            null,
            function () {
              if (l.getResponseHeader) {
                r.sapCpCSRFToken = l.getResponseHeader(o.CSRFTokenHeader);
              }
              i([r], true);
            },
            function () {
              if (!n) {
                t.Request.fetchToken([r], i, true);
              } else {
                t.Console.warn("Technical error occurred.");
                i([r], false);
              }
            }
          );
        }
      },
      postResult: function (e, i, n) {
        var a = t.getConfig(e),
          s = a.BasePath + a.ResultHeadersPath,
          r = this.buildRequest(e, "POST", s);
        this.send(
          r,
          i,
          function () {
            var e = JSON.parse(r.responseText);
            if (typeof e === "string") {
              e = JSON.parse(e);
            }
            e = (e && e.d) || e;
            n(e);
          },
          function () {
            t.Console.warn("Technical error occurred.");
            var e = null;
            if (r.responseText) {
              e = JSON.parse(r.responseText);
            }
            n(e);
          }
        );
      },
      isErrorResponse: function (e) {
        if (!e) {
          return true;
        }
        return !!e.error;
      },
    },
    Setting: {
      get: function (e, t) {
        return e.getAttribute("data-sap-cp-" + t);
      },
    },
    Node: {
      getAllWithClassName: function (e, i) {
        if (e.getElementsByClassName) {
          return e.getElementsByClassName(i);
        }
        if (e.querySelectorAll) {
          return e.querySelectorAll("." + i);
        }
        t.Console.warn("Browser not supported!");
        return [];
      },
      getFirstWithClassName: function (e, i) {
        var n = t.Node.getAllWithClassName(e, i);
        if (n && n[0]) {
          return n[0];
        }
        return null;
      },
      createEmptyOptionElement: function (e) {
        var t;
        t = document.createElement("option");
        t.value = "";
        t.selected = "selected";
        return t;
      },
    },
    CSS: {
      getClasses: function (e) {
        if (e.classList) {
          return e.classList;
        }
        var t = e.getAttribute("class");
        return t.split(" ");
      },
      setClasses: function (e, t) {
        var i = t.join(" ");
        e.setAttribute("class", i);
      },
      hasClass: function (e, t) {
        if (e.classList && e.classList.contains) {
          return e.classList.contains(t);
        }
        var i = this.getClasses(e);
        var n = i.indexOf(t);
        return n >= 0;
      },
      addClass: function (e, t) {
        if (e.classList && e.classList.add) {
          e.classList.add(t);
          return;
        }
        var i = this.hasClass(e, t);
        if (i) {
          return;
        }
        var n = this.getClasses(e);
        n.push(t);
        this.setClasses(e, n);
      },
      removeClass: function (e, t) {
        if (e.classList && e.classList.remove) {
          e.classList.remove(t);
          return;
        }
        var i = this.hasClass(e, t);
        if (!i) {
          return;
        }
        var n = this.getClasses(e);
        var a = n.indexOf(t);
        n.splice(a, 1);
        this.setClasses(e, n);
      },
      toggleClass: function (e, t, i) {
        var n = i;
        if (typeof n === "undefined") {
          n = !this.hasClass(e, t);
        }
        if (n) {
          return this.addClass(e, t);
        }
        return this.removeClass(e, t);
      },
    },
    Util: {
      findSiblingNodeByClassName: function (e, i) {
        var n = t.Util.findParentByClassName(e, "sapCpContentPage");
        return n.getElementsByClassName(i)[0];
      },
      findParentByClassName: function (e, i) {
        if (!e || !i) {
          return null;
        }
        if (t.CSS.hasClass(e, i)) {
          return e;
        }
        var n = e.parentNode;
        if (!n || n === e || n === document) {
          return null;
        }
        return this.findParentByClassName(n, i);
      },
      findWidgetByKey: function (e, i) {
        var n, a;
        for (a = 0; a < e.length; a++) {
          n = e[a];
          if (t.Setting.get(n, "key") === i) {
            return n;
          }
        }
        return null;
      },
      getCurrentUrl: function () {
        if (window !== window.top) {
          return document.referrer;
        }
        return window.location.href;
      },
      getOutboundId: function () {
        return this.getURLParameter("sap-outbound-id");
      },
      getCampaignId: function () {
        return this.getURLParameter("sap-campaign-id");
      },
      getURLParameter: function (e) {
        var t = window.location.search.substring(1).split("&");
        for (var i = 0; i < t.length; i++) {
          var n = t[i].split("="),
            a = decodeURIComponent(n[0]);
          if (a === e) {
            return decodeURIComponent(n[1]);
          }
        }
        return null;
      },
      appendOutboundId: function (e, i) {
        var n = i || t.Util.getOutboundId();
        if (n) {
          return t.Util.appendURLParameter(e, "sap-outbound-id", n);
        }
        return e;
      },
      appendURLParameter: function (e, t, i) {
        var n = t + "=" + i;
        if (e.indexOf("?") > 0) {
          return e.split("?")[0] + "?" + n + "&" + e.split("?")[1];
        } else if (e.indexOf("#") > 0) {
          return e.split("#")[0] + "?" + n + "#" + e.split("#")[1];
        }
        return e + "?" + n;
      },
      prefixHttpProtocol: function (e) {
        var t = e.indexOf("/"),
          i = e.indexOf("."),
          n = e.indexOf("://");
        if (t === 0 || i === 0) {
          return e;
        }
        if (n < 0 || t !== n + 1) {
          return "http://" + e;
        }
        return e;
      },
      openPage: function (e, i) {
        if (!i) {
          return;
        }
        var n = t.Util.prefixHttpProtocol(i);
        e.location.href = n;
      },
      openDownload: function (e, t) {
        if (!t) {
          return;
        }
        var i = this.prefixHttpProtocol(t);
        e.open(i, "_blank");
      },
    },
    Event: {
      registerListener: function (e, i, n) {
        if (e.addEventListener) {
          return e.addEventListener(i, n);
        }
        if (e.attachEvent) {
          return e.attachEvent("on" + i, n);
        }
        t.Console.warn("Browser not supported!");
        return false;
      },
    },
    Console: {
      warn: function (e) {
        if (window.console && window.console.warn) {
          window.console.warn(e);
        }
      },
    },
    Constants: {
      WidgetValueName: { DownloadURI: "DOWNLOAD_URI" },
      FollowUpAction: { FollowUpPage: "01", SuccessMessage: "02" },
    },
  };
  window.sap = window.sap || {};
  window.sap.hpa = window.sap.hpa || {};
  window.sap.hpa.cei = window.sap.hpa.cei || {};
  window.sap.hpa.cei.cntpg = window.sap.hpa.cei.cntpg || {};
  window.sap.hpa.cei.cntpg.run = window.sap.hpa.cei.cntpg.run || t;
  if (window.sap.hpa.cei.cntpg.testEnvironment) {
    return;
  }
  t.Event.registerListener(document, "DOMContentLoaded", function () {
    t.initialize();
  });
  if (
    document.readyState === "complete" ||
    document.readyState === "loaded" ||
    document.readyState === "interactive"
  ) {
    t.initialize();
  }
})();
//# sourceMappingURL=sapContentPage.js.map
