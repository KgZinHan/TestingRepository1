
/*JS functions for Category Printer */

function callAddCatgPrinterController() {
  $.ajax({
    url: "/StockCategoryPrinter/AddCatgPrinterPartial",
    type: "GET",
    success: function (data) {
      $('#defaultContainer').html(data);
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

  scrollToDiv();
}

function callEditCatgPrinterController(catgPrinterId) {
  var inputData = {
    catgPrinterId: catgPrinterId
  };

  $.ajax({
    url: "/StockCategoryPrinter/EditCatgPrinterPartial",
    type: "GET",
    dataType: "html",
    data: inputData,
    success: function (data) {
      $('#defaultContainer').html(data);
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

  scrollToDiv();
}

function callDeleteCatgPrinterController(catgPrinterId) {

  var inputData = {
    catgPrinterId: catgPrinterId
  };

  $.ajax({
    url: "/StockCategoryPrinter/DeleteCatgPrinterPartial",
    type: "GET",
    dataType: "html",
    data: inputData,
    success: function (data) {
      $('#defaultContainer').html(data);
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

  scrollToDiv();
}

