
/*JS functions for Auto Number*/

function callEditAutoNumberController(AutoNoId) {

  var inputData = {
    autoNoId: AutoNoId
  };

  $.ajax({
    url: "/AutoNumber/EditAutoNumberPartial",
    type: "GET",
    dataType: "html",
    data: inputData
  }).done(function (data) {
    $('#defaultContainer').html(data);
  }).fail(function () {
    alert('Session Expired!');
    window.location.href = '/LogIn/Index';  // Redirect to login
  });

  scrollToDiv();
}
