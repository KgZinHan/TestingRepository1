function callAddTableDefinitionController() {
  $.ajax({
    url: "/TableDefinition/AddTableDefinitionPartial",
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

function callEditTableDefinitionController(tableId) {
  var inputData = {
    tableId: tableId
  };

  $.ajax({
    url: "/TableDefinition/EditTableDefinitionPartial",
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

function callDeleteTableDefinitionController(tableId) {
  var inputData = {
    tableId: tableId
  };

  $.ajax({
    url: "/TableDefinition/DeleteTableDefinitionPartial",
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
