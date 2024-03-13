function callAddTableDefinitionController() {
  $.ajax({
    url: "/TableDefinition/AddTableDefinitionPartial",
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
    error: function (data) {
      alert('error');
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
    error: function (data) {
      alert('error');
    }
  });

  scrollToDiv();
}
