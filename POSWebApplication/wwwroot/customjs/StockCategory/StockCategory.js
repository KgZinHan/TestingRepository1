function callAddStockCategoryController() {
  $.ajax({
    url: "/StockCategory/AddStockCategoryPartial",
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

function callEditStockCategoryController(CatgId) {
  var inputData = {
    catgId: CatgId
  };

  $.ajax({
    url: "/StockCategory/EditStockCategoryPartial",
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

function callDeleteStockCategoryController(CatgId) {
  var inputData = {
    catgId: CatgId
  };

  $.ajax({
    url: "/StockCategory/DeleteStockCategoryPartial",
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

