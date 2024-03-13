function callAddCatgPrinterController() {
  $.ajax({
    url: "/StockCategoryPrinter/AddCatgPrinterPartial",
    type: "GET",
    success: function (data) {
      $('#defaultContainer').html(data);
    },
    error: function (data) {
      alert('error');
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
    error: function (data) {
      alert('error');
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
    error: function (data) {
      alert('error');
    }
  });

  scrollToDiv();
}
