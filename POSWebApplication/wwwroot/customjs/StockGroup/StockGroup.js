function callAddStockGroupController() {
  $.ajax({
    url: "/StockGroup/AddStockGroupPartial",
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

function callEditStockGroupController(StkGrpId) {
  var inputData = {
    stkGrpId: StkGrpId
  };

  $.ajax({
    url: "/StockGroup/EditStockGroupPartial",
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

function callDeleteStockGroupController(StkGrpId) {
  var inputData = {
    stkGrpId: StkGrpId
  };

  $.ajax({
    url: "/StockGroup/DeleteStockGroupPartial",
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
