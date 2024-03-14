function callAddSpecInstrController() {
  $.ajax({
    url: "/SpecialInstruction/AddSpecInstrPartial",
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
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
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
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

  scrollToDiv();
}
