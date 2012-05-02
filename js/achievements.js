//-----------------------------------------------------------------------
// Fill this in with a header
// Dependent upon jquery
//-----------------------------------------------------------------------

var ACH = {};

(function ()
{
	ACH.usrData = null;
	ACH.usrDataLoaded = false;
	ACH.curUser = "";
	ACH.loadingUser = "";
	reqID = 0;
	errTimeout = null;


	BatchLoad = function (user, startPage, endPage, ID, callback)
	{
		var returnedPages = 0;
		for (var pageNum = startPage; pageNum <= endPage; ++pageNum)
		{
			jQuery.ajax(
			{
				type : "GET",
				url : "http://api.kivaws.org/v1/lenders/" + user + "/loans.json",
				data : "page=" + pageNum,
				contentType: "application/json; charset=utf-8",
				dataType : "jsonp",
				jsonp : "jsonp",
				id : ID,
				success : function (data)
				{
					if (reqID === this.id)
					{
						returnedPages++;
						console.log("received page " + data.paging.page + " for user " + user + " on reqID " + reqID);
						ACH.usrData.loans = ACH.usrData.loans.concat(data.loans);
						if (returnedPages === endPage - startPage + 1)
						{
							ACH.usrDataLoaded = true;
							callback();
						}
					}
				},
				error : function (msg, url, line)
				{
					console.log("error connecting to Kiva");
				}
			})
		}
	}

	ACH.LoadData = function (user, callback, page, initial)
	{
		clearTimeout(errTimeout);
		reqID++;
		console.log("LoadData called for user " + user + " on reqID " + reqID);
		ACH.loadingUser = user;
		ACH.usrDataLoaded = false;
		ACH.usrData = null;


		page = page || 1;
		if (typeof initial === "undefined")
		{
			initial = true;
		}
		var timeout = 2000;
		errTimeout = setTimeout(function()
		{
			console.log("timed out");
			callback();
		}, timeout);
		jQuery.ajax(
		{
			type : "GET",
			url : "http://api.kivaws.org/v1/lenders/" + user + "/loans.json",
			data : "page=" + page,
			contentType: "application/json; charset=utf-8",
			dataType : "jsonp",
			jsonp : "jsonp",
			id : reqID,
			success : function (data)
			{
				clearTimeout(errTimeout);
				if (reqID === this.id)
				{
					ACH.usrData = data;
					if (data.paging.pages - data.paging.page > 0)
					{
						BatchLoad(user, data.paging.page + 1, data.paging.pages, this.id, callback);
					}
					else
					{
						ACH.usrDataLoaded = true;
						callback();
					}
				}
			},
			error : function (msg, url, line)
			{
				console.log("error connecting to Kiva");
			}
		})
	}

	ACH.HasMadeALoan = function()
	{
		if (ACH.usrData && ACH.usrData.loans)
		{
			return (ACH.usrData.loans.length > 0);
		}
		return false;
	}

	ACH.HasMadeFiveLoans = function()
	{
		if (ACH.usrData && ACH.usrData.loans)
		{
			return (ACH.usrData.loans.length >= 5);
		}
		return false;
	}

	ACH.HasMadeFiftyLoans = function()
	{
		if (ACH.usrData && ACH.usrData.loans)
		{
			return (ACH.usrData.loans.length >= 50);
		}
		return false;
	}

	ACH.Globetrotter = function()
	{
		if (ACH.usrData && ACH.usrData.loans)
		{
			var countryCodes = [];
			for (var i = 0; i < ACH.usrData.loans.length; ++i)
			{
				var loan = ACH.usrData.loans[i];
				//console.log(loan.location.country_code);
				if (jQuery.inArray(loan.location.country_code, countryCodes) == -1)
				{
					countryCodes.push(loan.location.country_code);
					if (countryCodes.length >= 10)
					{
						return true;
					}
				}
			}
		}
		//console.log(countryCodes)
		return false;
	}
})();