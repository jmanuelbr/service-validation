let config = {};
let selectedService = {};
let errors = {};

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
        }
    } catch (err) {
        console.log(err);
    }
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

$("#validate-cta").click(function() {
    switch (selectedService) {
        case 'bsl-prod-ngc-load':
            console.log('validating bsl-prod-ngc-load');
            validateBslProdNgcLoad()
            break;
        case 'sap-prod':
            // code block
            break;
        case 'ial-prod':
            // code block
            break;
        default:
            // code block
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
    console.info('Error found:', msg);
}

validateBslProdNgcLoad = () => {
    const textArea = $('#json-response').val();
    const res = JSON.parse(textArea);
    console.log('parsed', res);
    const data = res.data;
    if (!res.status) {
        addError("data.status does not exist");
    } else if (res.status.statusCode !== 200) {
        addError("res.status.statusCode is not 200");
    }
    if (!res.data.configState || !res.data.features || !res.data.images || !res.data.keyFeatures ||
        !res.data.price || !res.data.props || !res.data.specs || !res.data.timingPoints || !res.data.tyreInfo) {
        addError('bad level 1 data structure: data.X, some object is missing');
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

    }
}