/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/************************************************************************************************
 * * HIVE CREST | HVC
 * * HVC-3 | BACK END SUITELET SCRIPT
 *
 * **********************************************************************************************
 *
 * Author: Jobin & Jismi IT Services LLP
 *
 * Date Created : 15-February-2022
 *
 * Created By: Manikandan T.m., Jobin & Jismi IT Services LLP
 *
 * Description : Suitelet which will handle fetching the data from Netsuite transaction record.
 *
 * REVISION HISTORY
 *
 *
 ***********************************************************************************************/
define(['N/search', 'N/record', 'N/config', '/SuiteScripts/rfid mapping.js', '/SuiteScripts/createpayload.js'],
    /**
     * @param{search} search
     * @param{search} record
     */
    (search, record, config, mapping, createpayload) => {
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
         * @description To differenciate the GTIN object for identify with or without GTIN value.
         * @author Manikandan T.m.
         * @param {arrays of object} gtinData
         * @param {arrays of object} gtinObjectArray
         * @returns {arrays of object}
         */

        const gtinParameterCheck = function gtinParameterCheck(gtinData) {
            let gtinObjectArray = { itemInternalId: [], itemData: [], itemsWithGTIN: [], itemsWithOutGTIN: [], missingGtinItemCount: 0 };
            if (gtinData.length < 1) {
                return gtinObjectArray;
            }
            for (let count = 0; count < gtinData.length; count++) {
                gtinObjectArray['itemData'].push(gtinData[count]);
                gtinObjectArray['itemInternalId'].push(gtinData[count]['Internal_ID']['value']);
                checkForParameter(gtinData[count]['gtin']['value']) ? gtinObjectArray['itemsWithGTIN'].push(gtinData[count]) : gtinObjectArray['itemsWithOutGTIN'].push(gtinData[count]);
            }
            gtinObjectArray['missingGtinItemCount'] = gtinObjectArray['itemsWithOutGTIN'].length;
            return gtinObjectArray;
        }
        /**
         * @description To check the search errors.
         * @author Manikandan T.m.
         * @param {string}
         * @return {string}
         */
        const checkInvaildResult = function checkInvaildResult(result) {
            if(result == "ERROR: Invalid Expression" || result == "ERROR: Field Not Found"){
                return "";
            }
            return result;
        }

        /**
         * @description To identify the inventory record type.
         * @author Manikandan T.m.
         * @param {string}
         * @param {string} item recordType
         */
        const itemRecordTypeCheck = function itemRecordTypeCheck(recordType) {
            let recordTypeVal = false;
            if (recordType == "InvtPart") {
                recordTypeVal = record.Type.INVENTORY_ITEM;
            } else if (recordType == "NonInvtPart") {
                recordTypeVal = record.Type.NON_INVENTORY_ITEM;
            } else if (recordType == "Description") {
                recordTypeVal = record.Type.DESCRIPTION_ITEM;
            } else if (recordType == "Discount") {
                recordTypeVal = record.Type.DISCOUNT_ITEM;
            } else if (recordType == "GiftCert") {
                recordTypeVal = record.Type.GIFT_CERTIFICATE_ITEM;
            } else if (recordType == "Group") {
                recordTypeVal = record.Type.ITEM_GROUP;
            } else if (recordType == "Kit") {
                recordTypeVal = record.Type.KIT_ITEM;
            } else if (recordType == "Markup") {
                recordTypeVal = record.Type.MARKUP_ITEM;
            } else if (recordType == "OthCharge") {
                recordTypeVal = record.Type.OTHER_CHARGE_ITEM;
            } else if (recordType == "Payment") {
                recordTypeVal = record.Type.PAYMENT_ITEM;
            } else if (recordType == "Service") {
                recordTypeVal = record.Type.SERVICE_ITEM;
            } else if (recordType == "Subtotal") {
                recordTypeVal = record.Type.SUBTOTAL_ITEM;
            }
            return recordTypeVal;
        }

        const priceLevelMapping = function priceLevelMapping(ItemData){
            //log.debug('ItemData',ItemData)
            var configData = JSON.parse(exports.body);
            var itemSearchObj = search.create({
                type: "item",
                filters:
                    [
                        ["internalid","anyof", ItemData['itemInternalId']],
                        "AND",
                        ["pricing.currency","anyof", exports.currency],
                        "AND",
                        ["formulanumeric: {pricing.minimumquantity}","equalto","0"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "pricelevel",
                            join: "pricing",
                            label: "Price Level"
                        }),
                        search.createColumn({
                            name: "unitprice",
                            join: "pricing",
                            label: "Unit Price"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "pricing",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "currency",
                            join: "pricing",
                            label: "Currency"
                        }),
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        })
                    ]
            });
            itemSearchObj.run().each(function(result){
                for(var counter =0; counter < ItemData['itemData'].length; counter++){
                    if((Number(ItemData['itemData'][counter]['Internal_ID']['value']) == Number(result.getValue({ name: "internalid", label: "Internal ID" })) || ItemData['itemData'][counter]['Internal_ID']['text'].toLowerCase().trim() == result.getText({ name: "internalid", label: "Internal ID" }).toLowerCase().trim())){

                        if((configData['json'][mapping.text8].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() ||configData['json'][mapping.text8].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.text8].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.text8].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['text8'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.text9].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() ||configData['json'][mapping.text9].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.text9].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.text9].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['text9'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.text10].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.text10].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.text10].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.text10].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['text10'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.udf_1].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.udf_1].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.udf_1].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.udf_1].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['udf_1'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.udf_2].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() ||configData['json'][mapping.udf_2].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.udf_2].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.udf_2].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['udf_2'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.udf_3].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() ||configData['json'][mapping.udf_3].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.udf_3].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.udf_3].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['udf_3'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.udf_4].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() ||configData['json'][mapping.udf_4].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.udf_4].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.udf_4].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['udf_4'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.udf_5].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() ||configData['json'][mapping.udf_5].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.udf_5].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.udf_5].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['udf_5'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.udf_6].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() ||configData['json'][mapping.udf_6].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.udf_6].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.udf_6].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['udf_6'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                        if((configData['json'][mapping.udf_7].toLowerCase().trim() == result.getValue({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() ||configData['json'][mapping.udf_7].toLowerCase().trim() == result.getText({ name: "pricelevel", join: "pricing", label: "Price Level" }).toLowerCase().trim() || configData['json'][mapping.udf_7].toLowerCase().trim() == result.getText({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim() || configData['json'][mapping.udf_7].toLowerCase().trim() == result.getValue({ name: "internalid", join: "pricing", label: "Internal ID" }).toLowerCase().trim())){
                            ItemData['itemData'][counter]['udf_7'] = {"value": result.getValue({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '', "text": result.getText({ name: "unitprice", join: "pricing", label: "Unit Price" }) || '' }
                        };
                    }
                }
                return true;
            });
            return ItemData;
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


        /**
         * @description dataSets from Saved Search and formatting Saved Search results
         */
        const dataSets = {
            /**
             * @description Object referencing NetSuite Saved Search
             * @typedef {Object} SearchObj
             * @property {Object[]} filters - Filters Array in Search
             * @property {Object[]} columns - Columns Array in Search
             */
            /**
             * @description to format Saved Search column to key-value pair where each key represents each columns in Saved Search
             * @param {SearchObj} savedSearchObj
             * @param {void|String} priorityKey
             * @returns {Object.<String,SearchObj.columns>}
             */
            fetchSavedSearchColumn(savedSearchObj, priorityKey) {
                let columns = savedSearchObj.columns;
                let columnsData = {},
                    columnName = '';
                columns.forEach(function (result, counter) {
                    columnName = '';
                    if (result[priorityKey]) {
                        columnName += result[priorityKey];
                    } else {
                        if (result.summary)
                            columnName += result.summary + '__';
                        if (result.formula)
                            columnName += result.formula + '__';
                        if (result.join)
                            columnName += result.join + '__';
                        columnName += result.name;
                    }
                    columnsData[columnName] = result;
                });
                return columnsData;
            },

            /**
             * @description Representing each result in Final Saved Search Format
             * @typedef formattedEachSearchResult
             * @type {{value:any,text:any}}
             */
            /**
             * @description to fetch and format the single saved search result. ie, Search result of a single row containing both text and value for each columns
             * @param {Object[]} searchResult contains search result of a single row
             * @param {Object.<String,SearchObj.columns>} columns
             * @returns {Object.<String,formattedEachSearchResult>|{}}
             */

            formatSingleSavedSearchResult(searchResult, columns) {
                var responseObj = {};
                for (let column in columns)
                    responseObj[column] = {
                        value: checkInvaildResult(searchResult.getValue(columns[column])),
                        text: checkInvaildResult(searchResult.getText(columns[column]))
                    };
                return responseObj;
            },

            /**
             * @description to iterate over and initiate format of each saved search result
             * @param {SearchObj} searchObj
             * @param {void|Object.<String,SearchObj.columns>} columns
             * @returns {[]|Object[]}
             */

            iterateSavedSearch(searchObj, columns) {
                if (!checkForParameter(searchObj))
                    return false;
                if (!checkForParameter(columns))
                    columns = dataSets.fetchSavedSearchColumn(searchObj);

                var response = [];
                var searchPageRanges;
                try {
                    searchPageRanges = searchObj.runPaged({
                        pageSize: 1000
                    });
                } catch (err) {
                    return [];
                }
                if (searchPageRanges.pageRanges.length < 1)
                    return [];

                var pageRangeLength = searchPageRanges.pageRanges.length;
                log.debug('pageRangeLength', pageRangeLength);

                for (let pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                    searchPageRanges.fetch({
                        index: pageIndex
                    }).data.forEach(function (result) {
                        response.push(dataSets.formatSingleSavedSearchResult(result, columns));
                    });

                return response;
            },

            /**
             * @description - Saved Search which will retrieve all the items GTIN data from a trasaction record
             * @param {Number} recInternalId  - Internal Id of the transaction record
             * @returns {[]|Object[]}
             */

            getItemsGtinData(configData) {
                const transactionSearchGTINObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", "PurchOrd", "VendBill", "ItemRcpt"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["cogs", "is", "F"],
                            "AND",
                            ["shipping", "is", "F"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["internalid","anyof",configData.internalId],
                            "AND",
                            ["item.type", "anyof", "InvtPart"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.item_sid] + "}", label: "item_sid" }),
                            search.createColumn({ name: "upccode", join: "item", label: "upc" }),
                            search.createColumn({ name: "formulatext", formula: "'"+ exports.companyId + "'" , label: "sbs_no" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.alu] + "}", label: "alu" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.style_sid] + "}", label: "style_sid" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.dcs_code] + "}", label: "dcs_code" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.description1] + "}", label: "description1" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.description2] + "}", label: "description2" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.description3] + "}", label: "description3" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.description4] + "}", label: "description4" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.long_description] + "}", label: "long_description" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.item_no] + "}", label: "item_no" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.vend_code] + "}", label: "vend_code" }),
                            search.createColumn({ name: "formulatext", formula: "{item." +configData['json'][mapping.attr] + "}", label: "attr" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.gtin] + "}", label: "gtin" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.siz] + "}", label: "siz" }),
                            search.createColumn({ name: "formulatext", formula: configData['json'][mapping.cost], label: "cost" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.text1] + "}", label: "text1" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.text2] + "}", label: "text2" }),
                            search.createColumn({ name: "formulatext", formula: "{item." +  configData['json'][mapping.text3] + "}", label: "text3" }),
                            search.createColumn({ name: "formulatext", formula: "{item." +  configData['json'][mapping.text4] + "}", label: "text4" }),
                            search.createColumn({ name: "formulatext", formula: "{item." +  configData['json'][mapping.text5] + "}", label: "text5" }),
                            search.createColumn({ name: "formulatext", formula: "{item." +  configData['json'][mapping.text6] + "}", label: "text6" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.text7] + "}", label: "text7" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "text8" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "text9" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "text10" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "udf_1" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "udf_2" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "udf_3" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "udf_4" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "udf_5" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "udf_6" }),
                            search.createColumn({ name: "formulatext", formula: "''" , label: "udf_7" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.udf_8] + "}", label: "udf_8" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.udf_9] + "}", label: "udf_9" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.udf_10] + "}", label: "udf_10" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.udf_11] + "}", label: "udf_11" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.udf_12] + "}", label: "udf_12" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.udf_13] + "}", label: "udf_13" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.udf_14] + "}", label: "udf_14" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.dcs_name] + "}", label: "dcs_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.dcs_Long_name] + "}", label: "dcs_Long_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.d_name] + "}", label: "d_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.d_long_name] + "}", label: "d_long_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.department] + "}", label: "department" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.dept_long_name] + "}", label: "dept_long_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.c_name] + "}", label: "c_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.c_long_name] + "}", label: "c_long_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.class] + "}", label: "class" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.class_long_name] + "}", label: "class_long_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.s_name] + "}", label: "s_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.s_long_name] + "}", label: "s_long_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.subclass] + "}", label: "subclass" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.subclass_long_name] + "}", label: "subclass_long_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.season_id] + "}", label: "season_id" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.price], label: "price" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.sbs_name] + "}", label: "sbs_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.region_name] + "}", label: "region_name" }),
                            search.createColumn({ name: "formulatext", formula: "{item." + configData['json'][mapping.sector_name] + "}", label: "sector_name" }),
                            search.createColumn({ name: "externalid", join: "item", label: "External_ID" }),
                            search.createColumn({ name: "internalid", join: "item", label: "Internal_ID" }),
                            search.createColumn({ name: "type", join: "item", label: "Item_Type" }),
                            search.createColumn({ name: "formulatext", formula: "{quantity}", label: "quantity" }),
                            search.createColumn({ name: "formulatext", formula: "{tranid}", label: "Document Number" })
                        ]
                });
                let searchResultCount = transactionSearchGTINObj.runPaged().count;
                return dataSets.iterateSavedSearch(transactionSearchGTINObj, dataSets.fetchSavedSearchColumn(transactionSearchGTINObj, 'label'));
            },
            payloadCreationForPrint(items){
               let payload =  createpayload.createApiPayload(items)
               return payload;
            }
        }
        applyTryCatch(dataSets, 'dataSets');

        /**
         * @description ApiMethods available to the user
         * @type {{listOrders(): ({reason: string, data: null, status: string}),fetchOrder(): ({reason: string, data: null, status: string})}}
         */

        const apiMethods = {
            /**
             * @description To get the Customer Sales Data (Sales Summary, OX Support and Component Weighting)
             * @returns  {{reason: (string), data: null, status: string}|{reason: string, data: (Object[]|*[]), status: string}|{reason: string, data: null, status: string}}
             */
            getItemsGtinData() {

                let configBody = JSON.parse(exports.body);

                if (!configBody.internalId) {
                    return { status: 'FAILURE', reason: 'RECORD_INTERNALID_NOT_FOUND', data: null };
                }
                if(!util.isObject(configBody.json)){
                    return { status: 'FAILURE', reason: 'CONFIG_JSON_NOT_FOUND', data: null };
                }

                let gtinData = dataSets.getItemsGtinData(configBody);
                let itemData = priceLevelMapping(gtinParameterCheck(gtinData));
                return { status: 'SUCCESS', reason: 'RECORD_FOUND', data: { gtinData: itemData } };
            },
            /**
             * @description To set the GTIN number in the Item record
             * @returns  {{reason: (string), data: null, status: string}|{reason: string, data: (Object[]|*[]), status: string}|{reason: string, data: null, status: string}}
             */
            setItemsGtinData() {
                let configBody = JSON.parse(exports.body);
                let resposeObj = configBody.items;
                if (resposeObj.length < 1) {
                    return { status: 'FAILURE', reason: 'NO_ITEMS_FOUND', data: null };
                } else {
                    for (var counter = 0; counter < resposeObj.length; counter++) {
                        if (itemRecordTypeCheck(resposeObj[counter]["itemType"]) && checkForParameter(resposeObj[counter]["internalId"]) && checkForParameter(resposeObj[counter]["gtinNumber"])) {
                            try {
                                let id = record.submitFields({ type: itemRecordTypeCheck(resposeObj[counter]["itemType"]), id: resposeObj[counter]["internalId"], values: { custitem_jj_gtin_number_hvc_2: resposeObj[counter]["gtinNumber"] }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                if (id == resposeObj[counter]["internalId"]) {
                                    resposeObj[counter].UpdateComplete = true;
                                } else {
                                    resposeObj[counter].UpdateComplete = false;
                                }
                                log.debug('idVal', id);
                            } catch (error) {
                                resposeObj[counter].UpdateComplete = false;
                            }

                        } else {
                            resposeObj[counter].UpdateComplete = false;
                        }
                    }
                    return { status: 'SUCCESS', reason: 'ITEM_GTIN_UPDATED', data: resposeObj };
                }
                return { status: 'FAILURE', reason: 'UNKNOWN_ERROR', data: null };
            },
            fetchTransationData() {
                let configBody = JSON.parse(exports.body);

                if (!configBody.internalId) {
                    return { status: 'FAILURE', reason: 'RECORD_INTERNALID_NOT_FOUND', data: null };
                }

                if(!util.isObject(configBody.json)){
                    return { status: 'FAILURE', reason: 'CONFIG_JSON_NOT_FOUND', data: null };
                }

                if(!configBody.printLabel){
                    return { status: 'FAILURE', reason: 'LABEL_NOT_FOUND', data: null };
                }

                if(!configBody.printAction){
                    return { status: 'FAILURE', reason: 'ACTION_NOT_FOUND', data: null };
                }

                const items = dataSets.getItemsGtinData(configBody);
                let itemData = priceLevelMapping(gtinParameterCheck(items));
                let printApiPayload = dataSets.payloadCreationForPrint({
                    "data" : itemData['itemData'],
                    "printLabel" : configBody['printLabel'],
                    "printAction" :  configBody['printAction']
                });
                return { status: 'SUCCESS', reason: 'RECORD_FOUND', data: { payload: printApiPayload } };
            }

        };
        applyTryCatch(apiMethods, 'apiMethods');

        const exports = {

            /**
             * @description To initialise the export Object with the Suitelet methods and parameters
             * @param {Object} scriptContext
             * @param {ServerRequest} scriptContext.request - Incoming request
             * @param {ServerResponse} scriptContext.response - Suitelet response
             */

            init(context) {
                var companyInfo = config.load({ type: config.Type.COMPANY_INFORMATION });
                this.currency = companyInfo.getValue({ fieldId: 'basecurrency' });
                this.companyId = companyInfo.getValue({ fieldId: 'companyid' });
                this.context = context;
                this.method = context.request.method;
                this.parameters = context.request.parameters;
                this.body = context.request.body;
            },

            /**
             * @description To route request based on API Type
             * @returns {{reason: string, data: null, status: string}|undefined|{reason: string, data: null, status: string}}
             */

            routeRequest() {
                if (checkForParameter(exports.parameters.apiType)) {
                    switch (exports.parameters.apiType) {
                        case 'getTransactionGTINData': // To get the purchase order GTIN value for validation purpose
                            return apiMethods.getItemsGtinData();
                        case 'submitGTINData': // To submit the new GTIN numbers to the item record
                            return apiMethods.setItemsGtinData();
                        case 'fetchTransationData': // To submit the fetch item detail for API creation
                            return apiMethods.fetchTransationData();
                        default:
                            return { status: 'FAILURE', reason: 'INVALID_APITYPE', data: null };
                    }
                }
                return { status: 'FAILURE', reason: 'INVALID_APITYPE', data: null };
            },

            /**
             * Defines the Suitelet script trigger point.
             * @param {Object} scriptContext
             * @param {ServerRequest} scriptContext.request - Incoming request
             * @param {ServerResponse} scriptContext.response - Suitelet response
             * @since 2015.2
             */

            onRequest(context) {
                //Initialize Suitelet
                exports.init(context);
                return exports.sendResponse(exports.routeRequest() || {
                    status: 'FAILURE',
                    reason: 'ERROR',
                    data: null
                }), true;
            },

            /**
             * @description Structures and sens the response
             * @param STATUS - It will be either Success or Failure
             * @param REASON - Reason Code
             * @param DATA - Data to be passed if any
             * @returns {boolean}
             */
            sendResponse(STATUS, REASON, DATA) { //All response will be send from this common point
                if (arguments.length < 2) {
                    DATA = arguments[0].data;
                    REASON = arguments[0].reason;
                    STATUS = arguments[0].status;
                }

                return this.context.response.write(`${JSON.stringify({
                    summary: {
                        status: STATUS || (ERROR_STACK && util.isArray(ERROR_STACK) && ERROR_STACK.length > 0 ? 'FAILURE' : null),
                        reason: REASON || null,
                        error: (ERROR_STACK ? ERROR_STACK : null) || null,
                        request: {
                            parameters: this.parameters
                        }
                    },
                    data: (DATA ? DATA : null) || null
                })}`), true;
            }
        };
        applyTryCatch(exports, 'exports');

        return exports;

    });