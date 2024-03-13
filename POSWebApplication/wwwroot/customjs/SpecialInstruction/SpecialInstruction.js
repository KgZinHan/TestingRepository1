function callAddSpecInstrController() {
  $.ajax({
    url: "/SpecialInstruction/AddSpecInstrPartial",
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

function callEditSpecInstrController(SpecInstrId) {
  var inputData = {
    specInstrId: SpecInstrId
  };

  $.ajax({
    url: "/SpecialInstruction/EditSpecInstrPartial",
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

function callDeleteSpecInstrController(SpecInstrId) {
  var inputData = {
    specInstrId: SpecInstrId
  };

  $.ajax({
    url: "/SpecialInstruction/DeleteSpecInstrPartial",
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
