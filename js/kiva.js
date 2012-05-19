function replaceLoading(msg){
    jQuery("#loading").html(msg);
}

function addLog(msg){
    jQuery("#log").html(jQuery("#log").html() + msg + '<br/>');
}

function onError(tx, error) {
    addLog(error.message);
}


function saveFilter(){
	//save to cookie
	var searchName = jQuery('#searchNameBox').val().toUpperCase();
	var searchSector = jQuery('#searchSectorBox').val().toUpperCase();
	var searchCountry = jQuery('#searchCountryBox').val().toUpperCase();
	var searchActivity = jQuery('#searchActivityBox').val().toUpperCase();

	// any search criteria entered?
	if (searchName || searchSector || searchCountry || searchActivity) {

		var filterObject = {}; // New object
		filterObject['searchName'] = searchName;
		filterObject['searchSector'] = searchSector;
		filterObject['searchCountry'] = searchCountry;
		filterObject['searchActivity'] = searchActivity;
	 	
		var allFilters = new Array();

		if ($.cookies.get("filter")) {
			allFilters = $.cookies.get("filter");

			var newAllFilters = new Array();

			newAllFilters[0] = filterObject;

			// if 5 filters. delete last... going to replace it
			if(allFilters[4]) {
				allFilters.splice(4,4);
			}

			// Shift all filters down
			for (i=0;i<allFilters.length;i++){
				newAllFilters[i+1] = allFilters[i];
			}
			allFilters = newAllFilters;
		}else{
			allFilters[0] = filterObject;
		}

	    var jsonFilter = JSON.stringify(allFilters, null, 2);
		$.cookies.set("filter", jsonFilter);

		loadFilters();

	}

	return false;
}

function applyFilter(id){
	id = id-1;
	var allFilters = $.cookies.get("filter");

	if(allFilters[id]) {
		// there is a filter... apply it
		jQuery('#searchNameBox').val(allFilters[id].searchName);
		jQuery('#searchSectorBox').val(allFilters[id].searchSector);
		jQuery('#searchCountryBox').val(allFilters[id].searchCountry);
		jQuery('#searchActivityBox').val(allFilters[id].searchActivity);

		performSearch();
	}
	return false;
}

function filterLabel(filter){
	var label = "";
	if (filter.searchName) {
		label = "Name: " + filter.searchName;
	}else if(filter.searchSector) {
		label = label + "Sector: " + filter.searchSector;
	}else if (filter.searchCountry) {
		label = label + "Country: " + filter.searchCountry;
	}else if (filter.searchActivity) {
		label = label + "Activity: " + filter.searchActivity;
	}
	return label;
}

function loadFilters(){
	var allFilters = $.cookies.get("filter");

	$('#filterBtn1').hide();
	$('#filterBtn2').hide();
	$('#filterBtn3').hide();
	$('#filterBtn4').hide();
	$('#filterBtn5').hide();

	if (allFilters){

		for (i=0;i<allFilters.length;i++){
			$('#filterBtn'+(i+1)).text(filterLabel(allFilters[i]));
			$('#filterBtn'+(i+1)).show();
		}
	}
}

function clearSearchSelection() {
	jQuery('#searchNameBox').val('');
	jQuery('#searchSectorBox').val('');
	jQuery('#searchCountryBox').val('');
	jQuery('#searchActivityBox').val('');

	performSearch();

	return false;
}

var loans = new Array();
var totalPages = 0;
var pagesRemaining = 0;
var jslloans;

jQuery(document).ready( function() {
	$('#saveFilterBtn').click(saveFilter);
	$("#filterBtn1").click(function() {
  		applyFilter(1);
	});
	$("#filterBtn2").click(function() {
  		applyFilter(2);
	});
	$("#filterBtn3").click(function() {
  		applyFilter(3);
	});
	$("#filterBtn4").click(function() {
  		applyFilter(4);
	});
	$("#filterBtn5").click(function() {
  		applyFilter(5);
	});
	$("#clearSearchBtn").click(function() {
  		clearSearchSelection();
	});
	

	loadFilters();
});

function testStrCommaDelim(objvalue, str)
{
    if (str == undefined) return true;
    if (str.trim()=="") return true;
    var toTest = objvalue.toUpperCase();
    var arr = str.split(",");
    for (var i = 0; i < arr.length; i++){
        if (arr[i].trim() == "") return false;
        if (toTest.indexOf(arr[i]) != -1){
            return true;
        }
    }
    return false;
}

function buildCriteria(){
    return {
        name: function(){return jQuery('#searchNameBox').val().toUpperCase()},
        sector: function(){return jQuery('#searchSectorBox').val().toUpperCase()},
        country: function(){return jQuery('#searchCountryBox').val().toUpperCase()},
        activity: function(){return jQuery('#searchActivityBox').val().toUpperCase()},
        //partner: function(){return jQuery('#searchPartnerBox').val().toUpperCase()},
        isMatch: function(loan){
            try{
                return ((testStrCommaDelim(loan.name, this.name())
                    && (testStrCommaDelim(loan.sector,this.sector()))
                    && (testStrCommaDelim(loan.activity, this.activity()))
                    && (testStrCommaDelim(loan.country, this.country()))));
                    //&& (loan.Partner.toUpperCase().indexOf(this.partner())!= -1);
            }catch(e){
                addLog(e.message);
                return false;
            }
        }
    }
}

function performSearch(){
    try{
        var crit = buildCriteria();
        var tres = jsLoans.Where(function(aloan){ return crit.isMatch(aloan)});
    }catch(e){
        addLog(e.message);
    }
    renderResults(tres);
}

function displayTables(toOutput){
    replaceLoading("Querying local data...");
    jQuery('#results').html('');
    renderResults(toOutput);
            //'Search Partner: <input type="text" id="searchPartnerBox" onkeyup="performSearch();" >');
}

function renderResults(result) {
    var output = "";
    for (var i = 0, item = null; i < result.Count(); i++) {
        item = result.items[i];
         output +=
                '<li id="' + item.id + '" class="loans">' + item.country + ': (' + item.sector + ": " + item.activity + ') <a href="http://www.kiva.org/lend/' + item.id + '">' + item.name + '</a></li>';
    }
    replaceLoading(": " + result.Count());
    jQuery('#results').html("<ul class='loan-display'>"+output+"</ul>");
}

function receiveKBFile(data){
    jsLoans = JSLINQ(data.Loans).OrderBy(function(item){return item.country + ":" + item.name;});
    displayTables(jsLoans);
	jQuery('.loans').click( function(l) {
        var loanId = jQuery(this).attr('id');
		jQuery('#image').show();
		jQuery.each(data.Loans, function(i,loan) {
			if (loanId == loan.id) {
				jQuery('#borrower-name').html(loan.name);
				jQuery('#borrower-image').html('<img src="http://www.kiva.org/img/w300h300/' + loan.imgID  + '.jpg" />');
				jQuery('#loan-description').html('will use this loan ' + loan.use);
			}
		});
	});
}
jQuery.getJSON("jsonloans.json", null, receiveKBFile);