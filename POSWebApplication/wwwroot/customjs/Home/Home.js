
function showBillDs(billHId) {
  $('#billHModal').show();

  $.ajax({
    url: "/Home/GetBillDList",
    type: "GET",
    dataType: "html",
    data: { billHId: billHId }
  }).done(function (data) {
    $('#billEditBodyId').html(data);
  }).fail(function () {
    alert('Session Expired!');
    window.location.href = '/LogIn/Index';  // Redirect to login
  });
}

function search() {

  const allData = {
    fromDate: $('#filterFromDate').val(),
    toDate: $('#filterToDate').val(),
    shiftNo: $('#filterShiftNo').val()
  }

  console.log(allData);

  $.ajax({
    url: "/Home/Search",
    type: "POST",
    data: allData,
  }).done(function (data) {
    $('#mainTable').html(data);
  }).fail(function () {
    alert('Session Expired!');
    window.location.href = '/LogIn/Index';  // Redirect to login
  });
}

function printBillSlip(billNo) {
  $.ajax({
    type: 'POST',
    url: '/Sale/BillPrint',
    data: {
      billNo: billNo
    },
    success: function (response) {
      if (response == "Error") {
        alert('Error Occured!');
        return;
      }
      return;
    },
    error: function (error) {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function closeBillHEditModal() {
  $('#billHModal').hide();
}
