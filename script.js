let config = {};
let selectedService = {};
let errorsFound = false;
let displayEndpointList = false;

$(document).ready(function() {
    initialise();
});

function getData(ajaxurl) {
    return $.ajax({
        url: ajaxurl,
        type: 'GET',
    });
};

async function initialise() {
    try {
        const res = await getData('http://127.0.0.1:8080/config.json');
        config = res;
        for (const service in config) {
            $("#services").append($("<option>").attr("value", config[service].name).text(config[service].label));
			$("#endpointDropdown").append($("<a>").attr("href", config[service].name).attr("class","endpoint-list-item").text(config[service].label));
        }
    } catch (err) {
        console.log('ERROR!', err);
    }

    $("#select-endpoint-button").click(function () {
		endpointListToggle();
		if (displayEndpointList) {
			$( "#endpointSearchInput" ).focus()
		}
	})
	$(".endpoint-list-item").click(function(event) {
		event.preventDefault();
		selectedService = $(this).attr("href");
		const url = config[selectedService].url;
		$('#service-url').html("<i>URL example:</i> <a href='" + url + "' target='_blank'>" + url + "</a>");
		document.getElementById("service-url").style.visibility = "visible";
		$('#validate-cta').removeClass('disabled');
		$('#load-mock-cta').removeClass('disabled');
		$('#endpointDropdown').hide();
		displayEndpointList = false;
		$("#select-endpoint-button").html(config[selectedService].label);
		$("#json-response").val("{\n" +
			"\t...\n" +
			"}")
	});
}


$("#services").change(function(event) {
    selectedService = $(this).val();
    const url = config[$(this).val()].url;
    $('#service-url').html("<i>URL example:</i> <a href='" + url + "' target='_blank'>" + url + "</a>");
    document.getElementById("service-url").style.visibility = "visible";
    $('#validate-cta').removeClass('disabled');
    $('#load-mock-cta').removeClass('disabled');
});

async function setMocksInTextArea() {
    const res = await getData('http://127.0.0.1:8080/mocks/' + selectedService + '.json');
    $('#json-response').val(JSON.stringify(res));
}

$("#load-mock-cta").click(function() {
    setMocksInTextArea();
});


$("#prettify").click(function() {
    let textAreaJson = $('#json-response').val();
    try {
    	let parsedJson = JSON.parse(textAreaJson);
    	$('#json-response').val(JSON.stringify(parsedJson, undefined, 2));
    } catch(error) {
    	// Do nothing
    }

});


$("#validate-cta").click(function() {
		errorsFound = false;
		$("#error-list").empty();
		$('#no-errors').hide();
		$('#validation-passed-message').hide();
    const textArea = $('#json-response').val();
    let res = null;
    try {
    	res = JSON.parse(textArea);
    } catch(error) {
    	addError("Error parsing JSON, validate structure first");
    	return;
    }

    switch (selectedService) {
        case 'bsl-prod-ngc-load':
            validateBslProdNgcLoad(res);
            break;
        case 'sap-finance-filter-options':
            validateSapFinanceFilterOptions(res);
            break;
        case 'ial-getPaymentCalculator-default':
            validateIalGetPaymentCalculatorDefault(res);
            break;
		case 'ial-getPaymentCalculator-non-default':
			validateIalGetPaymentCalculatorNonDefault(res);
			break;
		case 'sap-doSearch-inventory-close-match':
			validateSapDoSearchCloseMatch(res);
			break;
		case 'sap-doSearch-inventory-exact-match':
			validateSapDoSearchExactMatch(res);
			break;
        default:
            // code block
    }

    if (!errorsFound) {
    	$('#modal-title').text('Validation passed');
    	$('#validation-passed-message').show();
    }
    else {
    	$('#modal-title').text('Validation errors found!');
    	$('#validation-passed-message').hide();
    }
});

// Code Snippet taken from the post
function getSafe(fn) {
    try {
        return fn();
    } catch (e) {
        // Do nothing
    }
}

addError = (msg) => {
		errorsFound = true;
		$("#error-list").append($("<div>").attr("class", "alert alert-danger")
				.attr("role", "alert").text(msg));
}

validateBslProdNgcLoad = (res) => {
    const data = res.data;
    if (!res.status) {
        addError("data.status does not exist");
        return;
    } else if (res.status.statusCode !== 200) {
        addError("res.status.statusCode is not 200");
        return;
    }
    if (!res.data || !res.data.configState || !res.data.features || !res.data.images || !res.data.keyFeatures ||
        !res.data.price || !res.data.props || !res.data.specs || !res.data.timingPoints || !res.data.tyreInfo) {
        addError('bad level 1 data structure: data.X, some object is missing');
      	return;
    }
    /*
     *	BY MARKETING 
     */
    if (!data.features.byMarketing) {
        addError('bad level 2 data structure: data.features.byMarketing is missing');
    } else {
        for (let i = 0; i < data.features.byMarketing.length; i++) {
            /*
             *	SERIES
             */
            if (data.features.byMarketing[i].code == "series") {
                let series = data.features.byMarketing[i];
                if (!series || series.length <= 0) {
                    addError("bad level 3 data.features.byMarketing[{series}] no data present");
                } else {
                    if (!series.features || series.features.length <= 0) {
                        addError("bad level 4 data.features.byMarketing[{series}].feature no data present");
                    } else {
                        for (let j = 0; j < series.features.length; j++) {
                            let feature = series.features[j];
                            if (!feature.images || !feature.images.feature || feature.images.feature.length <= 0) {
                                addError("bad level 5 data.features.byMarketing[{series}].feature.images no data present");
                            }
                        }
                    }
                }
            }
            /*
             *	BODYSTYLE
             */
            else if (data.features.byMarketing[i].code == "bodystyle") {
                let bodystyle = data.features.byMarketing[i];
                if (!bodystyle.features || bodystyle.features <= 0) {
                    addError("bad level 3 data.features.byMarketing[{bodystyle}].features no data present");
                }
            }
            /*
             *	POWERTRAIN
             */
            if (data.features.byMarketing[i].code == "powertrain") {
                let powertrain = data.features.byMarketing[i];
                if (!powertrain.children || powertrain.children <= 0) {
                    addError("bad level 3 data.features.byMarketing[{powertrain}].children no data present");
                }
            }
            /*
             *	PAINT
             */
            if (data.features.byMarketing[i].code == "paint") {
                let paint = data.features.byMarketing[i];
                if (!paint.children || paint.children.length <= 0) {
                    addError("bad level 3 data.features.byMarketing[{paint}].children no data present");
                } else {
                    for (let j = 0; j < paint.children.length; j++) {
                        let paintChild = paint.children[j];
                        if (!paintChild || !paintChild.features || paintChild.features.length <= 0) {
                            addError("bad level 4 data.features.byMarketing[{paint}].children no data present");
                        } else {
                            for (let k = 0; k < paintChild.features.length; k++) {
                                const paintImages = paintChild.features[k];
                                if (!paintImages.images || !paintImages.images.feature ||
                                	!paintImages.images.feature[0] || !paintImages.images.feature[0].url || 
                                	paintImages.images.feature[0].url.length <= 0) {
                                    addError("bad level 5 data.features.byMarketing[{paint}].children.images no data present");
                                }
                            }
                        }
                    }
                }
            }
            /*
             *	TRIM
             */
            if (data.features.byMarketing[i].code == "trim") {
                let trim = data.features.byMarketing[i];
                if (!trim || !trim.features || trim.features.length <= 0) {
                    addError("bad level 3 data.features.byMarketing[{trim}].features no data present");
                } else {
	                for (let j = 0; j < trim.features.length; j++) {
	                    let trimFeature = trim.features[j];
	                    if (!trimFeature.images || !trimFeature.images.feature ||
	                    	trimFeature.images.feature.length <= 0 || !trimFeature.images.feature[0].url || 
	                    	trimFeature.images.feature[0].url.length <= 0) {
	                    	addError("bad level 4 data.features.byMarketing[{trim}].features.images.feature no data present");
	                    }
	                }
                    
                }
            }
            /*
             *	FEATURES
             */
            if (data.features.byMarketing[i].code == "features") {
                let features = data.features.byMarketing[i];
                if (!features || !features.children || features.children.length <= 0) {
                    addError("bad level 3 data.features.byMarketing[{features}].children no data present");
                } else {
	                for (let j = 0; j < features.children.length; j++) {
	                    let feature = features.children[j];
	                    if (!feature.children || feature.children.length <= 0 || !feature.children[0].features ||
	                    	feature.children[0].features.length <= 0) {
	                    	addError("bad level 4 data.features.byMarketing[{feature}].children.feature no data present");
	                    }
	                }
                    
                }
            }
            /*
             *	INTERIOR
             */
            if (data.features.byMarketing[i].code == "interior") {
                let interior = data.features.byMarketing[i];
                if (!interior.features || interior.features.length <= 0) {
                    addError("bad level 3 data.features.byMarketing[{interior}].features no data present");
                } 
            }
            /*
             *	EXTERIOR
             */
            if (data.features.byMarketing[i].code == "exterior") {
                let exterior = data.features.byMarketing[i];
                if (!exterior.features || exterior.features.length <= 0) {
                    addError("bad level 3 data.features.byMarketing[{exterior}].features no data present");
                } 
            }
        }
    }
    if (!data.images) {
        addError('bad level 1 data structure: data.images is missing');
    }
    else {
    	/*
       *	EXTERIOR IMAGES
       */
    	if (!data.images.exterior) {
        addError('bad level 2 data structure: data.images.exterior is missing');
    	}
    	else {
    		for (let i = 0; i < data.images.exterior.length; i++) {
    			const img = data.images.exterior[i];
    			if (!img.urls || img.urls.length <= 0 || img.urls[0].length <=0) {
    				addError('bad level 3 data structure: data.images.exterior.urls is missing');
    			}
    		}
    	}
    	/*
       *	EXTERIOR 3D DRIVER
       */
    	if (!data.images.exterior_3d_driver) {
        addError('bad level 2 data structure: data.images.exterior_3d_driver is missing');
    	}
    	else {
    		for (let i = 0; i < data.images.exterior_3d_driver.length; i++) {
    			const img = data.images.exterior_3d_driver[i];
    			if (!img.urls || img.urls.length <= 0 || img.urls[0].length <=0) {
    				addError('bad level 3 data structure: data.images.exterior_3d_driver.urls is missing');
    			}
    		}
    	}
    	/*
       *	INTERIOR IMAGES
       */
    	if (!data.images.interior) {
        addError('bad level 2 data structure: data.images.interior is missing');
    	}
    	else {
    		for (let i = 0; i < data.images.interior.length; i++) {
    			const img = data.images.interior[i];
    			if (!img.urls || img.urls.length <= 0 || img.urls[0].length <=0) {
    				addError('bad level 3 data structure: data.images.interior.urls is missing');
    			}
    		}
    	}
    	/*
       *	INTERIOR 360 IMAGES
       */
    	if (!data.images.interior_360) {
        addError('bad level 2 data structure: data.images.interior_360 is missing');
    	}
    	else {
    		for (let i = 0; i < data.images.interior_360.length; i++) {
    			const img = data.images.interior_360[i];
    			if (!img.urls || img.urls.length <= 0 || img.urls[0].length <=0) {
    				addError('bad level 3 data structure: data.images.interior_360.urls is missing');
    			}
    		}
    	}
    	/*
       *	INTERIOR 360 DRIVER
       */
    	if (!data.images.interior_360_driver) {
        addError('bad level 2 data structure: data.images.interior_360_driver is missing');
    	}
    	else {
    		for (let i = 0; i < data.images.interior_360_driver.length; i++) {
    			const img = data.images.interior_360_driver[i];
    			if (!img.urls || img.urls.length <= 0 || img.urls[0].length <=0) {
    				addError('bad level 3 data structure: data.images.interior_360_driver.urls is missing');
    			}
    		}
    	}
    	/*
       *	SHOWROOM
       */
    	if (!data.images.showroom) {
        addError('bad level 2 data structure: data.images.showroom is missing');
    	}
    	else {
    		for (let i = 0; i < data.images.showroom.length; i++) {
    			const img = data.images.showroom[i];
    			if (!img.urls || img.urls.length <= 0 || img.urls[0].length <=0) {
    				addError('bad level 3 data structure: data.images.showroom.urls is missing');
    			}
    		}
    	}
    	/*
       *	KEY FEATURES
       */
    	if (!data.keyFeatures || !data.keyFeatures.walkup || !data.keyFeatures.walkup.combined ||
    		!data.keyFeatures.walkup.combined.features || data.keyFeatures.walkup.combined.features.length <= 0) {
        addError('bad level 2 data structure: data.keyfeatures is missing or empty');
    	}
    	else {
    		for (let i = 0; i < data.keyFeatures.walkup.combined.features.length; i++) {
    			const feature = data.keyFeatures.walkup.combined.features[i];
    			if (!feature.code || feature.code.length <= 0 || !feature.name || feature.name.length <= 0) {
    				addError('bad level 3 data structure: data.images.keyfeature.features.name or code is missing');
    			}
    		}
    	}
    }
}

validateIalGetPaymentCalculatorDefault = (res) => {
	if (!res.success || res.success !== true) {
		addError('success is not true');
		return;
	}
	if (!res.plans || res.plans.length <= 0) {
		addError('No plans returned');
		return;
	}
	else {
		for (let i = 0; i < res.plans.length; i++) {
            let plan = res.plans[i];
            if (!plan || !plan.code || plan.code.length <= 0) {
            	addError('plan.code is empty or missing');
            	return;
            }
            if (plan.termValues && plan.termValues.length > 0) {
            	for (let j = 0; j < plan.termValues.length; j++) {
            			let termValue = plan.termValues[j];
            			if (!termValue.term || termValue.term.length <= 0) {
            				addError('termValue.term for plan ' + plan.code + ' is empty');
            			}
            			if (termValue.minDeposit === null || termValue.minDeposit === undefined) {
            				addError('termValue.minDeposit for plan ' + plan.code + ' is empty');
            			}
            			if (termValue.maxDeposit === null || termValue.maxDeposit === undefined) {
            				addError('termValue.maxDeposit for plan ' + plan.code + ' is empty');
            			}
            }
          }
          else if (plan.termValues && plan.termValues.length <= 0) {
          	addError('termValues array for plan ' + plan.code + ' is empty');
          }
          if (plan.mileageValues && plan.mileageValues.length > 0) {
            	for (let j = 0; j < plan.mileageValues.length; j++) {
            			let mileageValue = plan.mileageValues[j];
            			if (!mileageValue.mileage || mileageValue.mileage.length <= 0) {
            				addError('mileageValue.mileage for plan ' + plan.code + ' is empty');
            			}
            }
          }
          else if (plan.mileageValues && plan.mileageValues.length <= 0) {
          	addError('mileageValues array for plan ' + plan.code + ' is empty');
          }

      }		
	}

}

validateIalGetPaymentCalculatorNonDefault = (res) => {
    if (!res) {
		addError("Response is not valid");
		return;
	}
    if (!res.success) {
		addError("Success returned is not true");
		return;
	}
	if (!res.monthlyPayment || typeof res.monthlyPayment != 'number' || res.monthlyPayment <= 0) {
		addError("monthlyPayment is invalid");
	}
	if (!res.term || typeof res.term != 'number' || res.term <= 0) {
		addError("term is invalid");
	}
	if (!res.sellingPrice || typeof res.sellingPrice != 'number' || res.sellingPrice <= 0) {
		addError("sellingPrice is invalid");
	}
}
validateSapFinanceFilterOptions = (res) => {
	if (!res.displayValues || !res.displayValues.plans || res.displayValues.plans.length <= 0) {
		addError('No plans available');
	}
	else {
		const plans = res.displayValues.plans;
		for (let i = 0; i < plans.length; i++) {
			const plan = plans[i];
			if (!plan.name || plan.name.length <= 0) {
				addError('The plan has no name');
			}
			if (!plan.code || plan.code.length <= 0) {
				addError('The plan has no code');
			}
			if (plan.termValues && plan.termValues.length <=0) {
				addError('termvalues list for plan is empty');
			}
			if (plan.mileageValues && plan.mileageValues.length <=0) {
				addError('mileageValues list for plan is empty');
			}
			if (plan.termValues && plan.termValues.length > 0) {
				for (let j = 0; j < plan.termValues.length; j++) {
					const termValue = plan.termValues[j];
					if (!termValue.term || typeof termValue.term != "number") {
						addError('Incorrect data for termvalue.term in one of the plans');
					}
				}
			}
			if (plan.mileageValues && plan.mileageValues.length > 0) {
				for (let j = 0; j < plan.mileageValues.length; j++) {
					const mileage = plan.mileageValues[j];
					if (!mileage.mileage || typeof mileage.mileage != "number") {
						addError('Incorrect data for milageValue.mileage in one of the plans');
					}
				}
			}
		}
	}
}

validateSapDoSearchCloseMatch = (res) => {
	if (!res) {
		addError('Error in SAP response, incorrect format');
	}
	else {
		const pagination = res.pagination;
		if (!pagination) {
			addError('Error in SAP response, pagination field does not exist');
		}
		else {
			if (pagination.totalResults == 0) {
				addError('Error in SAP response, totalResults returned is 0');
			}
			else if (typeof pagination.totalResults != "number") {
				addError('Error in SAP response, totalResults is not a number');
			}
			else if (!pagination.totalResults) {
				addError('Error in SAP response, totalResults field does not exist');
			}
		}
	}
}

validateSapDoSearchExactMatch = (res) => {
	if (!res) {
		addError('Error in SAP response, incorrect format');
	}
	else {
		const pagination = res.pagination;
		if (!pagination) {
			addError('Error in SAP response, pagination field does not exist');
		}
		else {
			if (pagination.totalResults == 0) {
				addError('Error in SAP response, totalResults returned is 0');
			}
			else if (typeof pagination.totalResults != "number") {
				addError('Error in SAP response, totalResults is not a number');
			}
			else if (!pagination.totalResults) {
				addError('Error in SAP response, totalResults field does not exist');
			}
		}
	}
}

endpointListToggle = () => {
	displayEndpointList = !displayEndpointList;
	$('#endpointDropdown').toggle(displayEndpointList);
};


$("#endpointSearchInput").keyup(function(e){
	let input, filter, ul, li, a, i;
	if (e.key == "Escape") {
		displayEndpointList = !displayEndpointList;
		$('#endpointDropdown').toggle(displayEndpointList);
	}
	input = document.getElementById("endpointSearchInput");
	filter = input.value.toUpperCase();
	div = document.getElementById("endpointDropdown");
	a = div.getElementsByTagName("a");
	for (i = 0; i < a.length; i++) {
		txtValue = a[i].textContent || a[i].innerText;
		if (txtValue.toUpperCase().indexOf(filter) > -1) {
			a[i].style.display = "";
		} else {
			a[i].style.display = "none";
		}
	}
});