/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/************************************************************************************************
 * * HIVE CREST | HVC **
 *
 * **********************************************************************************************
 *
 * Author: Jobin & Jismi IT Services LLP
 *
 * Date Created : 15-February-2022
 *
 * Created By: Manikandan T.m, Jobin & Jismi IT Services LLP
 *
 * Description : Button on transaction record which will redirect the user to print CONFIG window.
 *
 * REVISION HISTORY
 *
 *
 ***********************************************************************************************/
define([],

    () => {

        /**
         * @description Global variable for storing errors ----> for debugging purposes
         * @type {Array.<Error>}
         * @constant
         */
        const ERROR_STACK = [];

        /**
         * @description Check whether the given parameter argument has value on it or is it empty.
         * ie, To check whether a value exists in parameter
         * @author Manikandan T.m.
         * @param {*} parameter parameter which contains/references some values
         * @param {*} parameterName name of the parameter, not mandatory
         * @returns {Boolean} true if there exist a value else false
         */
        const checkForParameter = function checkForParameter(parameter, parameterName) {
            if (parameter !== "" && parameter !== null && parameter !== undefined && parameter !== false && parameter !== "null" && parameter !== "undefined" && parameter !== " " && parameter !== 'false') {
                return true;
            } else {
                if (parameterName)
                    log.debug('Empty Value found', 'Empty Value for parameter ' + parameterName);
                return false;
            }
        }

        /**
         * @description To assign a default value if the value argument is empty
         * @author Manikandan T.m.
         * @param {String|Number|Boolean|Object|Array|null|undefined} value
         * @param {String|Number|Boolean|Object|Array} defaultValue
         * @returns {*} either value or defaultValue
         */
        const assignDefaultValue = function assignDefaultValue(value, defaultValue) {
            if (checkForParameter(value))
                return value;
            else
                return defaultValue;
        }

        /**
         * @description Common Try-Catch function, applies to Object contains methods/function
         * @author Manikandan T.m.
         * @param {Object.<string,Function|any>} DATA_OBJ Object contains methods/function
         * @param {String} NAME  Name of the Object
         * @returns {void}
         */
        const applyTryCatch = function applyTryCatch(DATA_OBJ, NAME) {
            /**
             * @description  Try-Catch function
             * @author Manikandan T.m.
             * @param {Function} myfunction - reference to a function
             * @param {String} key - name of the function
             * @returns {Function|false}
             */
            const tryCatch = function (myfunction, key) {
                return function () {
                    try {
                        return myfunction.apply(this, arguments);
                    } catch (e) {
                        log.error("error in " + key, e);
                        ERROR_STACK.push(e.toString());
                        return false;
                    }
                };
            }

            for (let key in DATA_OBJ) {
                if (typeof DATA_OBJ[key] === "function") {
                    DATA_OBJ[key] = tryCatch(DATA_OBJ[key], NAME + "." + key);
                }
            }
        }


        const exports = {
            /**
             * Defines the function definition that is executed before record is loaded.
             * @param {Object} scriptContext
             * @param {Record} scriptContext.newRecord - New record
             * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
             * @param {Form} scriptContext.form - Current form
             * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
             * @since 2015.2
             */
            beforeLoad(scriptContext) {
                log.debug('scriptContext',scriptContext)
                if (scriptContext.type == 'view') {
                    const dashboardTemplateURL = '';
                    let recordId = scriptContext.newRecord.id;
                    let HIDDEN_INLINE_HTML_FIELD = scriptContext.form.addField({
                        id: "custpage_jj_rfid_print_btn_hvc_2",
                        type: "INLINEHTML",
                        label: "Dashboard Link HVC-2"
                    });
                    HIDDEN_INLINE_HTML_FIELD.defaultValue = `<script>
                        window.___RFID_DASHBOARD_LINK_HVC3___="${dashboardTemplateURL}&transId=${recordId}";
                        window.___showTransaction_RFID_modal___ = function(){window.open( window.___RFID_DASHBOARD_LINK_HVC3___,"_self")};                
                        </script>`;
                    scriptContext.form.addButton({
                        id: 'custpage_jj_rfid_dashboard_hvc_3',
                        label: 'PRINT TRANSACTION RFID',
                        functionName: '___showTransaction_RFID_modal___'
                    });
                }
            }
        }
        applyTryCatch(exports, 'exports');
        return exports;

    });