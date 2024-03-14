

/*** Barcode methods ***/
function focusInput() {
  if (!$('#searchID').is(':focus')
    && !$('#returnRemarkID').is(':focus')
    && !$('#selectFolio').is(':focus')
    && !$('#printToKitchenListId tr td input').is(':focus')
    && !$('#inputSpecInstr').is(':focus')
  ) {
    $('#barcodeID').focus();
  }
}

setInterval(focusInput, 100);

function addStockByBarcode() {

  const barcode = $('#barcodeID').val();

  if (barcode != "") {
    var pkgFlg = false;
    $.ajax({
      url: "/Sale/GetItemIdByBarcode",
      type: "GET",
      data: { barcode: barcode },
      success: function (itemId) {
        if (itemId != "") {
          addStock(itemId, 1);
          $('#barcodeID').val('');
        }
        else {
          pkgFlg = true;
        }
      },
      error: function () {
        alert('Session Expired!');
        window.location.href = '/LogIn/Index';  // Redirect to login
      }
    });

    if (pkgFlg === false) {
      $.ajax({
        url: "/Sale/GetPkgHIdByBarcode",
        type: "GET",
        data: { barcode: barcode },
        success: function (pkgItem) {
          if (pkgItem != "") {
            addStockPackage(pkgItem);
            $('#barcodeID').val('');
          }
          else {
            pkgFlg = true;
          }
        },
        error: function () {
          alert('Session Expired!');
          window.location.href = '/LogIn/Index';  // Redirect to login
        }
      });
    }

  }
}


/*** Sale Item Field ***/


function addStock(ItemId, qty) {

  var quantityColumn = 2;
  var priceColumn = 3;
  var discountColumn = 4;
  var amountColumn = 5;
  var columnCount = 7;
  var flag = false;

  var tableCells = $('#mainBodyId tr td');
  tableCells.each(function (index) {

    var cellText = $(this).attr('id');
    // var cellText = $(this).text();

    if (index === 1 || (index % columnCount === 1)) { // trace itemId column location in table
      if (cellText === ItemId) { //Check onclick item is already onclick or not

        flag = true; // Already there

        var tdQuantity = $(tableCells[index + quantityColumn])
        var tdPrice = $(tableCells[index + priceColumn])
        var tdDiscount = $(tableCells[index + discountColumn])
        var tdAmount = $(tableCells[index + amountColumn])

        tdQuantity.text(parseInt(tdQuantity.text()) + parseInt(qty))

        var amount = (parseInt(tdPrice.text()) * parseInt(tdQuantity.text())) - parseInt(tdDiscount.text());
        tdAmount.text(amount.toLocaleString());
        // remove highlight first
        $('#mainBodyId tr.highlight').removeClass('highlight');
        $(this).closest('tr').addClass('highlight');
      }
    }

    calculateBillTotal(); // To calculate bill total

  });

  if (flag == false) {
    addStockItem(ItemId, qty);
  }
}

function addStockPackage(pkgHId) {
  $.ajax({
    url: "/Sale/GetItemsList",
    type: "GET",
    dataType: "json",
    data: { pkgHId: pkgHId },
    success: function (items) {
      items.forEach(function (item) {
        addStock(item.itemId, item.qty);
      });
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  })
}

function addStockItem(ItemId, qty) { // Main method of adding
  var inputData = {
    itemId: ItemId
  }
  $.ajax({
    url: "/Sale/AddStock",
    type: "GET",
    dataType: "json",
    data: inputData,
    success: function (stock) {

      // remove highlight first
      $('#mainBodyId tr.highlight').removeClass('highlight');

      var newRow = $('<tr>').css('border', '1px solid silver');
      newRow.addClass('highlight');
      // Number Field
      var number = lastNumber();
      newRow.append($('<td>').text(number).css('padding', '14px 12px'));

      // ItemId Field
      var tdItemDesc = $('<td>').text(stock.itemDesc).css({
        'padding': '14px 12px',
        'cursor': 'pointer'
      }).addClass('text-truncate').attr('id', stock.itemId);
      newRow.append(tdItemDesc);


      // BaseUnit Field
      var tdBaseUnit = $('<td>').text(stock.baseUnit).css({
        'padding': '14px 12px',
        'cursor': 'pointer'
      });
      newRow.append(tdBaseUnit);

      // Quantity Field
      var tdQuantity = $('<td>').text(qty).css({
        'padding': '14px 12px',
        'cursor': 'pointer'
      });
      newRow.append(tdQuantity);

      // Price Field
      var tdSellingPrice = $('<td>').text(stock.sellingPrice).css({
        'padding': '14px 12px',
        'text-align': 'right',
        'cursor': 'pointer'
      });
      newRow.append(tdSellingPrice);

      // Discount Field
      var tdDiscount = $('<td>').text(0).css({
        'padding': '14px 12px',
        'text-align': 'right',
        'cursor': 'pointer'
      });
      newRow.append(tdDiscount);

      // Amount Field
      const tdAmountText = (parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text())) - parseInt(tdDiscount.text());
      var tdAmount = $('<td>').text(tdAmountText.toLocaleString()).css({
        'padding': '14px 12px',
        'text-align': 'right'
      });
      newRow.append(tdAmount);

      // Cancel Btn
      var tdCancel = $('<i>').addClass('fas fa-times fa-2x').css({
        'cursor': 'pointer',
        'color': 'red',
        'padding': '14px 14px'
      });
      newRow.append(tdCancel);

      // call numberpad function
      const numberPad = document.getElementById('numberPad');
      const display = $('#display');
      const buttons = $('.number-pad button');
      var fstClkFlg = false;

      function handleButtonClick(td, buttonText) {
        switch (buttonText) {

          case 'C':
            display.val('');
            break;

          case 'Enter':
            if (display.val() === '') {
              display.val('0');
            }

            td.text(display.val());

            if (td !== tdAmount) {
              const quantity = parseInt(tdQuantity.text());
              const sellingPrice = parseInt(tdSellingPrice.text());
              const discount = parseInt(tdDiscount.text());
              var amount = (quantity * sellingPrice) - discount;
              tdAmount.text(amount.toLocaleString());
            }

            display.val('');
            $('#numberPad').hide();
            fstClkFlg = false;
            calculateBillTotal();
            $('#percentButton').attr('disabled', true);
            break;

          case '%':
            const disPercentAmt = (parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text()) * display.val()) / 100;
            td.text(disPercentAmt);
            var amount = (parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text())) - parseInt(td.text());
            tdAmount.text(amount.toLocaleString());
            display.val('');
            $('#numberPad').hide();
            fstClkFlg = false;
            calculateBillTotal();
            $('#percentButton').attr('disabled', true);
            break;

          case 'X':
            display.val('');
            $('#numberPad').hide();
            fstClkFlg = false;
            $('#percentButton').attr('disabled', true);
            break;

          default:
            if (!fstClkFlg) {
              display.val('');
              fstClkFlg = true;
            }
            display.val(display.val() + buttonText);
            break;
        }
      }

      // ItemDesc Cell click
      tdItemDesc.on('click', function () {
        $('#spanItemDescTitle').text(stock.itemId);
        $('#specInstrModal').show();
        $.ajax({
          url: "/Sale/GetSpecialInstructions",
          type: "GET",
          data: inputData,
          success: function (data) {
            var selectSpecInstr = $('#selectSpecInstr');
            selectSpecInstr.empty();
            data.forEach(function (instr) {
              selectSpecInstr.append($('<option>').val(instr.specInstr).text(instr.specInstr));
            });
          },
          error: function () {
            alert('Session Expired');
            window.location.href('');
          }
        });
        var escapedItemId = stock.itemId.replace(/\s/g, "\\ ");
        var specInstructions = $('#specInstr' + escapedItemId).text();
        specInstructions = specInstructions.replace(/[()]/g, '');
        $('#inputSpecInstr').val(specInstructions);
      })


      // UOM cell click
      tdBaseUnit.on('click', function () {
        const uomList = document.getElementById('uomList');
        uomList.style.display = 'block';

        var inputData = {
          itemId: ItemId
        }

        $.ajax({
          url: "/Sale/UOMList",
          type: "GET",
          dataType: "html",
          data: inputData,
          success: function (data) {
            var parsedData = JSON.parse(data);
            $('#UOMListId').empty();
            parsedData.forEach(function (item) {
              const newRow = $('<tr>').append(
                $('<td>').text(item.uomCde).css('padding', '14px 12px'),
                $('<td>').text(item.sellingPrice).css('padding', '14px 12px'),
              ).css('cursor', 'pointer');

              newRow.on('click', function () {
                tdBaseUnit.text(item.uomCde);
                tdSellingPrice.text(item.sellingPrice);
                tdAmount.text((parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text())) - parseInt(tdDiscount.text()));
                calculateBillTotal();
                uomList.style.display = 'none';
              });

              $('#UOMListId').append(newRow);
            });
          },
          error: function (data) {
            alert('error');
          }
        });
      })

      // Quantity cell click
      tdQuantity.on('click', function () {
        numberPad.style.display = "grid";
        $('#display').val(tdQuantity.text());
        buttons.off('click').on('click', function () {
          const buttonText = this.textContent;
          handleButtonClick(tdQuantity, buttonText);
        })
      })

      // Price cell click
      tdSellingPrice.on('click', function () {
        numberPad.style.display = "grid";
        $('#display').val(tdSellingPrice.text());
        buttons.off('click').on('click', function () {
          const buttonText = this.textContent;
          handleButtonClick(tdSellingPrice, buttonText);
        })
      })

      // Discount cell click
      tdDiscount.on('click', function () {
        $('#percentButton').removeAttr('disabled');
        numberPad.style.display = "grid";
        $('#display').val(tdDiscount.text());
        buttons.off('click').on('click', function () {
          const buttonText = this.textContent;
          handleButtonClick(tdDiscount, buttonText);
        })
      })

      // Cancel btn click
      tdCancel.on('click', function () {
        $(this).closest('tr').remove();
        changeNumberColumn();
        calculateBillTotal();
      });

      $('#mainBodyId').append(newRow);
      calculateBillTotal();

    },
    error: function () {
      alert('Error occurred.');
    }
  });
}


/*Bill Total*/ /*Bill Discount*/ /*Net Amount*/


function clickFunction(elementId) {
  const thisItem = $('#' + elementId);
  const numberPad = document.getElementById('numberPad');
  const display = $('#display');
  const buttons = $('.number-pad button');
  numberPad.style.display = "grid";
  display.val(thisItem.val()); // assign the original value first
  var fstClkFlg = false;

  function handleButtonClick(buttonText) {
    switch (buttonText) {

      case 'C':
        display.val('');
        break;

      case 'Enter':
        if (display.val() === "") {
          display.val('0');
        }
        const formattedDisplayValue = parseInt(display.val()).toLocaleString();
        thisItem.val(formattedDisplayValue);
        display.val('');
        numberPad.style.display = 'none';
        fstClkFlg = false;
        if (elementId !== "netAmount") {
          calculateNetAmount();
        }
        break;

      case 'X':
        display.val('');
        numberPad.style.display = 'none';
        fstClkFlg = false;
        break;

      default:
        if (!fstClkFlg) {
          display.val('');
          fstClkFlg = true;
        }
        display.val(display.val() + buttonText);
        break;
    }
  }
  buttons.off('click').on('click', function () {
    const buttonText = this.textContent;
    handleButtonClick(buttonText);
  })
}



/*Common Functions*/


function calculateBillTotal() {
  var amountColumn = 6;
  var columnCount = 7;
  var billTotal = 0;
  var tableCells = $('#mainBodyId tr td');
  var billTotalField = $('#billTotal');
  tableCells.each(function (index) {

    if (index === amountColumn || (index % columnCount === amountColumn)) { // trace amount column location in table
      billTotal = parseInt(billTotal) + parseInt($(this).text().replace(',', ''));
    }

  })
  billTotalField.val(billTotal.toLocaleString()); // format with comma and set
  calculateNetAmount();
}


function calculateNetAmount() {
  var billTotalField = $('#billTotal');
  var billDiscountField = $('#billDiscount');
  var netAmountField = $('#netAmount');
  var netAmountSecField = $('#paymentNetAmountDisplayId'); // for payment modal
  var netAmountBtrField = $('#btrPaymentNetAmountDisplayId'); // for btr payment modal
  var returnAmountField = $('#returnAmountDisplayId'); // for return modal

  if (!billDiscountField.val()) { // Check is there discount or not
    billDiscountField.val(0);
  }

  var billTotal = parseInt(billTotalField.val().replace(',', '')); // remove comma from value
  var billDiscount = parseInt(billDiscountField.val().replace(',', '')); // remove comma from value

  var valNetAmount = billTotal - billDiscount;

  netAmountField.val(valNetAmount.toLocaleString()); // format with comma and set
  netAmountSecField.val(netAmountField.val().toLocaleString()) // for payment modal
  netAmountBtrField.val(netAmountField.val().toLocaleString()) // fro btr payment modal
  returnAmountField.val(netAmountField.val().toLocaleString()) // for return modal
}


function lastNumber() { // To check what is last number of No. column in table
  var lastRow = $('#mainBodyId tr:last td:first-child');
  if (lastRow.text() == '') {
    return 1;
  }
  return parseInt(lastRow.text()) + 1;
}


function changeNumberColumn() {
  var numberColumnCells = $('#mainBodyId tr td:first-child');
  let lastNumber = 0;

  numberColumnCells.each(function (index) {
    $(this).text(index + 1);

    /*let parsedNumber = parseInt($(this).text());

    if (parsedNumber - lastNumber > 1) {
      $(this).text(lastNumber + 1);
      parsedNumber = lastNumber + 1;
    }

    lastNumber = parsedNumber;*/
  });

}


function clearAll() {
  clearScreen();
  generatedAutoNo();
}


function clearScreen() {
  // sale div
  $('#mainBodyId').empty();
  $('#billTotal').val(0);
  $('#billDiscount').val(0);
  $('#netAmount').val(0);
  $('#inputCustomer').val('Customer');
  $('#inputTableNo').val('Table');
  $('#inputSelectedTableNo').val('');
  // void modal
  $('#hiddenChosenBillHId').val('');
  // payment modal
  $('#paymentNetAmountDisplayId').val(0);
  $('#paymentTypeBodyId').empty();
  $('#paymentTableBodyId').empty();
  // return modal
  $('#returnAmountDisplayId').val(0);
  $('#returnTableBodyId').empty();
}


function generatedAutoNo() {
  $.ajax({
    url: "/Sale/GenerateAutoBillNo",
    type: "GET",
    dataType: "html",
    success: function (generatedBillNo) {
      $('#billNoId').val(generatedBillNo); // for new bill no
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}



/*BillSave*/


function addDataToTable() {
  const billNo = $('#billNoId').val();
  const disc = $('#billDiscount').val();
  const custId = $('#hiddenCustId').val();
  const custNme = $('#inputCustomer').val();
  const tableNo = $('#inputSelectedTableNo').val();

  const tableData = [];
  const table = document.getElementById('saleTable');

  // Loop through all rows (start from index 1 to skip the table header)
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    const rowData = [];

    for (let j = 0; j < row.cells.length; j++) {
      if (j === 1) { // push itemid not itemdesc
        rowData.push(row.cells[j].id);
      }
      else {
        rowData.push(row.cells[j].textContent);
      }
    }
    var specInstr = $(row.cells[1]).find('span').text();
    specInstr = specInstr.replace(/[()]/g, '');
    rowData.push(specInstr);

    tableData.push(rowData);
  }

  if (tableData.length > 0) {
    $.ajax({
      type: 'POST',
      url: '/Sale/SaveBillToBillH',
      data: {
        billNo: billNo,
        discAmt: disc,
        custId: custId,
        custNme: custNme,
        tableNo: tableNo,
        tableData: tableData
      },
      success: function (billHId) {
        if (billHId == 0) {
          console.log('Error occured!');
          return;
        }
        console.log('Data added successfully!');
        printToKitchen(billHId);
        clearAll();
      },
      error: function () {
        alert('Session Expired!');
        window.location.href = '/LogIn/Index';  // Redirect to login
      }
    });
  }
  else {
    alert('Please choose stock item first');
  }

}



/*BillLookUp*/


function chooseBillLookUp() {
  const loadingScreen = document.getElementById('tableLoadingScreen');
  loadingScreen.style.display = "block";
  $.ajax({
    url: "/Sale/SavedBillHList",
    type: "GET",
    success: function (data) {
      loadingScreen.style.display = "none";
      $('#billHListId').empty();
      data.forEach(function (bill) {

        const billDate = new Date(bill.bizDte);
        const localDate = new Date(billDate.getTime() - (billDate.getTimezoneOffset() * 60000)); // adjust the date
        const day = String(localDate.getDate()).padStart(2, '0');
        const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = localDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        const newRow = $('<tr>').append(
          $('<td>').text(bill.billNo).css('padding', '14px 12px'),
          $('<td>').text(formattedDate).css('padding', '14px 12px'),
          $('<td>').text(bill.shiftNo).css('padding', '14px 12px'),
          $('<td>').text(bill.totalAmount.toLocaleString()).css({ 'padding': '14px 12px', 'textAlign': 'right' })
        );

        newRow.on('click', function () {
          billLookUp(bill.billhId);
        }).css('cursor', 'pointer');

        $('#billHListId').append(newRow);
      });
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function billLookUp(billhId) {
  var inputData = {
    billhId: billhId
  };

  $.ajax({
    url: "/Sale/FindBill",
    type: "GET",
    dataType: "html",
    data: inputData,
    success: function (data) {
      clearScreen();
      var parsedData = JSON.parse(data);
      parsedData.forEach(function (item) {
        var newRow = $('<tr>').css('border', '1px solid silver');
        // Number Cell
        newRow.append($('<td>').text(item.ordNo).css('padding', '14px 12px'));

        // ItemId Cell
        var tdItemDesc = $('<td>').text(item.itemDesc).css({
          'padding': '14px 12px',
          'cursor': 'pointer'
        }).attr('id', item.itemID);
        tdItemDesc.append($('<br>'));
        if (item.specInstr != null && item.specInstr != "") {
          tdItemDesc.append($('<span>').text('(' + item.specInstr + ')').attr('id', 'specInstr' + item.itemID));
        }
        newRow.append(tdItemDesc);

        // BaseUnit Cell
        var tdBaseUnit = $('<td>').text(item.uomCde).css({
          'padding': '14px 12px',
          'cursor': 'pointer'
        });
        newRow.append(tdBaseUnit);

        // Quantity Cell
        var tdQuantity = $('<td>').text(item.qty).css({
          'padding': '14px 12px',
          'cursor': 'pointer'
        });
        newRow.append(tdQuantity);

        // Price Cell
        var tdSellingPrice = $('<td>').text(item.price).css({
          'padding': '14px 12px',
          'text-align': 'right',
          'cursor': 'pointer'
        });
        newRow.append(tdSellingPrice);

        // Discount Cell
        var tdDiscount = $('<td>').text(item.discAmt).css({
          'padding': '14px 12px',
          'text-align': 'right',
          'cursor': 'pointer'
        });
        newRow.append(tdDiscount);

        // Amount Cell
        const tdAmountText = (parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text())) - parseInt(tdDiscount.text()); // Calculation
        var tdAmount = $('<td>').text(tdAmountText.toLocaleString()).css({
          'padding': '14px 12px',
          'text-align': 'right'
        });
        newRow.append(tdAmount);

        // Cancel Button
        var tdCancel = $('<i>').addClass('fas fa-times fa-2x').css({
          'cursor': 'pointer',
          'color': 'red',
          'padding': '14px 14px'
        });
        newRow.append(tdCancel);

        // call numberpad 
        const numberPad = document.getElementById('numberPad');
        const display = $('#display');
        const buttons = $('.number-pad button');
        var fstClkFlg = false;

        function handleButtonClick(td, buttonText) {
          switch (buttonText) {

            case 'C':
              display.val('');
              break;

            case 'Enter':
              if (display.val() === '') {
                display.val('0');
              }

              td.text(display.val());

              if (td !== tdAmount) {
                const quantity = parseInt(tdQuantity.text());
                const sellingPrice = parseInt(tdSellingPrice.text());
                const discount = parseInt(tdDiscount.text());
                tdAmount.text((quantity * sellingPrice) - discount);
              }

              display.val('');
              $('#numberPad').hide();
              fstClkFlg = false;
              calculateBillTotal();
              $('#percentButton').attr('disabled', true);
              break;

            case '%':
              const disPercentAmt = (parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text()) * display.val()) / 100;
              td.text(disPercentAmt);
              tdAmount.text((parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text())) - parseInt(td.text()));
              display.val('');
              $('#numberPad').hide();
              fstClkFlg = false;
              calculateBillTotal();
              $('#percentButton').attr('disabled', true);
              break;

            case 'X':
              display.val('');
              $('#numberPad').hide();
              fstClkFlg = false;
              $('#percentButton').attr('disabled', true);
              break;

            default:
              if (!fstClkFlg) {
                display.val('');
                fstClkFlg = true;
              }
              display.val(display.val() + buttonText);
              break;
          }
        }

        //ItemDesc cell click
        tdItemDesc.on('click', function () {
          $('#spanItemDescTitle').text(item.itemID);
          $('#specInstrModal').show();
          $.ajax({
            url: "/Sale/GetSpecialInstructions",
            type: "GET",
            data: {
              itemId: item.itemID
            },
            success: function (data) {
              var selectSpecInstr = $('#selectSpecInstr');
              selectSpecInstr.empty();
              data.forEach(function (instr) {
                selectSpecInstr.append($('<option>').val(instr.specInstr).text(instr.specInstr));
              });
            },
            error: function () {
              alert('Session Expired');
              window.location.href('');
            }
          });
          var escapedItemId = item.itemID.replace(/\s/g, "\\ ");
          var specInstructions = $('#specInstr' + escapedItemId).text();
          specInstructions = specInstructions.replace(/[()]/g, '');
          $('#inputSpecInstr').val(specInstructions);
        })

        // UOM cell click
        tdBaseUnit.on('click', function () {
          const uomList = document.getElementById('uomList');
          uomList.style.display = 'block';

          var inputData = {
            itemId: item.itemID
          }

          $.ajax({
            url: "/Sale/UOMList",
            type: "GET",
            dataType: "html",
            data: inputData,
            success: function (data) {
              var parsedData = JSON.parse(data);
              $('#UOMListId').empty();
              parsedData.forEach(function (item) {
                const newRow = $('<tr>').append(
                  $('<td>').text(item.uomCde).css('padding', '14px 12px'),
                  $('<td>').text(item.sellingPrice).css('padding', '14px 12px'),
                ).css('cursor', 'pointer');

                newRow.on('click', function () {
                  tdBaseUnit.text(item.uomCde);
                  tdSellingPrice.text(item.sellingPrice);
                  tdAmount.text((parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text())) - parseInt(tdDiscount.text()));
                  calculateBillTotal();
                  uomList.style.display = 'none';
                });

                $('#UOMListId').append(newRow);
              });
            },
            error: function (data) {
              alert('error');
            }
          });
        })

        // Quantity cell click
        tdQuantity.on('click', function () {
          numberPad.style.display = "grid";
          $('#display').val(tdQuantity.text());
          buttons.off('click').on('click', function () {
            const buttonText = this.textContent;
            handleButtonClick(tdQuantity, buttonText);
          });
        });

        // Price cell click
        tdSellingPrice.on('click', function () {
          numberPad.style.display = "grid";
          $('#display').val(tdSellingPrice.text());
          buttons.off('click').on('click', function () {
            const buttonText = this.textContent;
            handleButtonClick(tdSellingPrice, buttonText);
          });
        });

        // Discount cell click
        tdDiscount.on('click', function () {
          $('#percentButton').removeAttr('disabled');
          numberPad.style.display = "grid";
          $('#display').val(tdDiscount.text());
          buttons.off('click').on('click', function () {
            const buttonText = this.textContent;
            handleButtonClick(tdDiscount, buttonText)
          });
        });

        // Cancel cell click
        tdCancel.on('click', function () {
          $(this).closest('tr').remove();
          changeNumberColumn();
          calculateBillTotal();
        });

        $('#mainBodyId').append(newRow);
        calculateBillTotal();

      }); // end of forEach parseData
      const id = parsedData[0].billhId;
      changeBillNo(id);
      changeBillDiscount(id);
      changeBillH(id);
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function changeBillNo(billhId) { // Change Bill No. based on the choosed Bill of Bill Lookup
  const inputData = {
    billhId: billhId
  };

  $.ajax({
    url: "/Sale/ChangeBillNo",
    type: "GET",
    dataType: "html",
    data: inputData,
    success: function (response) {
      $('#billNoId').val(response);
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function changeBillDiscount(billhId) { // Change Bill Discount based on the choosed Bill of Bill Lookup
  const inputData = {
    billhId: billhId
  };

  $.ajax({
    url: "/Sale/ChangeBillDiscount",
    type: "GET",
    dataType: "html",
    data: inputData,
    success: function (decimalDiscount) {
      // format the decimal to int
      const intDiscount = parseInt(decimalDiscount).toLocaleString();
      $('#billDiscount').val(intDiscount);
      calculateNetAmount();
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function changeBillH(billhId) { // Change Bill Discount based on the choosed Bill of Bill Lookup
  const inputData = {
    billhId: billhId
  };

  $.ajax({
    url: "/Sale/ChangeCustomer",
    type: "GET",
    data: inputData,
    success: function (billH) {
      $('#inputCustomer').val(billH.guestNme);
      $('#hiddenCustId').val(billH.guestId);
      $('#inputSelectedTableNo').val(billH.tableNo);
      if (billH.tableNo == null || billH.tableNo == "") {
        billH.tableNo = "Table";
      }
      $('#inputTableNo').val(billH.tableNo);

    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}




/*BillReprint*/


function chooseBillReprint() {
  const loadingScreen = document.getElementById('tableLoadingScreen');
  loadingScreen.style.display = "block";
  $.ajax({
    url: "/Sale/PaidBillHList",
    type: "GET",
    success: function (data) {
      loadingScreen.style.display = "none";
      $('#billReprintListId').empty();
      data.forEach(function (bill) {

        const billDate = new Date(bill.bizDte);
        const localDate = new Date(billDate.getTime() - (billDate.getTimezoneOffset() * 60000)); // adjust the date
        const day = String(localDate.getDate()).padStart(2, '0');
        const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = localDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        const newRow = $('<tr>').append(
          $('<td>').text(bill.billNo).css('padding', '14px 12px'),
          $('<td>').text(formattedDate).css('padding', '14px 12px'),
          $('<td>').text(bill.shiftNo).css('padding', '14px 12px'),
          $('<td>').text(bill.totalAmount.toLocaleString()).css({ 'padding': '14px 12px', 'textAlign': 'right' })
        );
        newRow.on('click', function () {
          const shouldProceed = window.confirm("Are you sure you want to reprint this bill?");
          if (shouldProceed) {
            printBillSlip(bill.billNo);
          }
        }).css('cursor', 'pointer');

        $('#billReprintListId').append(newRow);
      });
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}



/*BillVoid*/


function chooseBillVoidable() {
  const loadingScreen = document.getElementById('tableLoadingScreen');
  loadingScreen.style.display = "block";
  $.ajax({
    url: "/Sale/BillHList",
    type: "GET",
    success: function (data) {
      loadingScreen.style.display = "none";
      $('#billVoidableListId').empty();
      data.forEach(function (bill) {

        const billDate = new Date(bill.bizDte);
        const localDate = new Date(billDate.getTime() - (billDate.getTimezoneOffset() * 60000)); // adjust the date
        const day = String(localDate.getDate()).padStart(2, '0');
        const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = localDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        const newRow = $('<tr>').append(
          $('<td>').text(bill.billNo).css('padding', '14px 12px'),
          $('<td>').text(formattedDate).css('padding', '14px 12px'),
          $('<td>').text(bill.shiftNo).css('padding', '14px 12px'),
          $('<td>').text(bill.totalAmount.toLocaleString()).css({ 'padding': '14px 12px', 'textAlign': 'right' })
        );
        newRow.on('click', function () {
          showBillToVoid(bill.billhId);
        }).css('cursor', 'pointer');

        $('#billVoidableListId').append(newRow);
      });
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function showBillToVoid(billhId) {
  var inputData = {
    billhId: billhId
  };

  $.ajax({
    url: "/Sale/FindBill",
    type: "GET",
    dataType: "html",
    data: inputData,
    success: function (data) {
      clearScreen();
      var parsedData = JSON.parse(data);
      parsedData.forEach(function (item) {
        var newRow = $('<tr>');

        // Number Cell
        newRow.append($('<td>').text(item.ordNo).css('padding', '14px 12px'));

        // ItemId Cell
        newRow.append($('<td>').text(item.itemDesc).css('padding', '14px 12px').attr('id', item.itemID));

        // BaseUnit Cell
        var tdBaseUnit = $('<td>').text(item.uomCde).css({
          'padding': '14px 12px'
        });
        newRow.append(tdBaseUnit);

        // Quantity Cell
        var tdQuantity = $('<td>').text(item.qty).css({
          'padding': '14px 12px'
        });
        newRow.append(tdQuantity);

        // Price Cell
        var tdSellingPrice = $('<td>').text(item.price).css({
          'padding': '14px 12px',
          'text-align': 'right'
        });
        newRow.append(tdSellingPrice);

        // Discount Cell
        var tdDiscount = $('<td>').text(item.discAmt).css({
          'padding': '14px 12px',
          'text-align': 'right'
        });
        newRow.append(tdDiscount);

        // Amount Cell
        const tdAmountText = (parseInt(tdQuantity.text()) * parseInt(tdSellingPrice.text())) - parseInt(tdDiscount.text()); // Calculation
        var tdAmount = $('<td>').text(tdAmountText.toLocaleString()).css({
          'padding': '14px 12px',
          'text-align': 'right'
        });
        newRow.append(tdAmount);

        // Cancel Button
        var tdCancel = $('<i>').addClass('fas fa-times fa-2x').css({
          'color': 'red',
          'padding': '14px 14px',
          'border': '1px solid silver'
        });
        newRow.append(tdCancel);

        $('#mainBodyId').append(newRow);
        calculateBillTotal();

      }); // end of forEach parseData
      const id = parsedData[0].billhId;
      changeBillNo(id);
      changeBillDiscount(id);
      changeBillH(id);
      $('#hiddenChosenBillHId').val(billhId); // assign to void
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function showConfirmation() {
  let choseBillHId = $('#hiddenChosenBillHId').val(); // assign choosen billHId
  if (choseBillHId === '') { // check is there choosen billHId or not
  }
  else {
    const shouldProceed = window.confirm("Are you sure you want to void this bill?");
    if (shouldProceed) {
      voidBill(choseBillHId);
    }
    else {
      clearScreen();
      generatedAutoNo();
    }
  }
}

function voidBill(billhId) {
  $.ajax({
    url: "/Sale/VoidBill",
    type: "GET",
    dataType: "html",
    data: {
      billHId: billhId
    },
    success: function (data) {
      clearScreen();

    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}


/*Tableno*/

function chooseTableNo() {
  const loadingScreen = document.getElementById('tableLoadingScreen');
  loadingScreen.style.display = "block";
  $('#tableNoModal').css("zIndex", "10000");
  $('#tableNoModal').show();
  var thisTableNo = $('#inputTableNo').val();

  $.ajax({
    url: "/Sale/TableNoList",
    type: "GET",
    success: function (data) {
      loadingScreen.style.display = "none";
      $('#tableNoListId').empty();

      var mainRow = $('<div>').addClass('col-12 row');
      data.forEach(function (table) {
        const newRow = $('<div>').addClass('col-2 btn btn-default m-1').text(table.tableNo);
        mainRow.append(newRow);
        newRow.on('click', function () {
          var thisTblNo = $(this).text();

          var currentTableNo = $('#inputTableNo').val();
          if (currentTableNo) {
            if (currentTableNo == "Table") {
              currentTableNo = thisTblNo;
            }
            else {
              currentTableNo += ',' + thisTblNo;
            }

          } else {
            currentTableNo = thisTblNo;
          }
          $('#inputTableNo').val(currentTableNo);
          $('#inputSelectedTableNo').val(currentTableNo);
        });

      });
      $('#tableNoListId').append(mainRow);
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function clearSelectedTableNo() {
  $('#inputTableNo').val('Table');
  $('#inputSelectedTableNo').val('');
}

function closeTableNoModal() {
  $('#tableNoModal').hide();
}


/*** Special Instructions Modal ***/

function addSpecInstr() {
  var selectValue = $('#selectSpecInstr').val();
  var inputValue = $('#inputSpecInstr').val();

  var itemId = $('#spanItemDescTitle').text();
  var escapedItemId = itemId.replace(/\s/g, "\\ ");
  var tdItemDesc = $('#mainBodyId').find('td#' + escapedItemId);

  tdItemDesc.find('br').remove();
  tdItemDesc.find('span').remove();
  tdItemDesc.append($('<br>'));
  if (selectValue.length > 0 && inputValue) {
    // If both are not empty, append them with a comma separator
    tdItemDesc.append($('<span>').text('(' + selectValue + ', ' + inputValue + ')').attr('id', 'specInstr' + itemId));
  } else if (selectValue.length > 0 && inputValue == "") {
    // If either one is not empty, append it without a comma separator
    tdItemDesc.append($('<span>').text('(' + selectValue + ')').attr('id', 'specInstr' + itemId));
  } else if (inputValue != "") {
    // If either one is not empty, append it without a comma separator
    tdItemDesc.append($('<span>').text('(' + inputValue + ')').attr('id', 'specInstr' + itemId));
  }

  closeSpecInstrModal();
}

function closeSpecInstrModal() {
  $('#specInstrModal').hide();
}


/*Print to Kitchen*/

function printToKitchen(billHId) {
  const loadingScreen = document.getElementById('tableLoadingScreen');
  loadingScreen.style.display = "block";
  $('#printToKitchenModal').css("zIndex", "10000");
  $('#printToKitchenModal').show();
  $.ajax({
    url: "/Sale/GetPrintToKitchenList",
    type: "GET",
    data: {
      billHId: billHId
    },
    success: function (list) {
      $('#ptkBillHId').val(billHId);

      loadingScreen.style.display = "none";
      $('#printToKitchenListId').empty();

      list.forEach(function (ptk) {
        var inputSpecInstr = $('<input>').val(ptk.specInstr).css({ 'padding': '14px 12px', 'border': 'none', 'width': '100%', 'color': '#31849B' }).attr('id', 'inputPTK');
        const newRow = $('<tr>').append(
          $('<td>').text(ptk.no).css('padding', '14px 12px'),
          $('<td>').text(ptk.itemDesc).css('padding', '14px 12px'),
          $('<td>').text(ptk.qty).css('padding', '14px 12px'),
          $('<td>').css('padding', '0px').append(inputSpecInstr),
          $('<td>').text(ptk.printer).css('padding', '14px 12px')
        );
        if (ptk.printerStatus == true || ptk.printerStatus == 1) {
          var statusIcon = $('<i>').addClass('fas fa-check-circle').css({ 'color': 'green' });
          newRow.append($('<td>').css({ 'padding': '14px 12px', 'textAlign': 'center' }).append(statusIcon));
        }
        else {
          var statusIcon = $('<i>').addClass('fas fa-times-circle').css({ 'color': 'red' });
          newRow.append($('<td>').css({ 'padding': '14px 12px', 'textAlign': 'center' }).append(statusIcon));
        }

        $('#printToKitchenListId').append(newRow);
      });
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

}

function printOrders() {

  var billHId = $('#ptkBillHId').val();
  console.log(billHId);

  $.ajax({
    url: "/Sale/OrderPrint",
    type: "GET",
    data: {
      ptkBillHId: billHId
    },
    success: function () {
      location.reload();
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function closePrintToKitchenModal() {
  $('#printToKitchenModal').hide();
}



/*Customer*/

function chooseCustomer() {
  const loadingScreen = document.getElementById('tableLoadingScreen');
  loadingScreen.style.display = "block";
  $('#customerModal').css("zIndex", "10000");
  $('#customerModal').show();

  $.ajax({
    url: "/Sale/CustomerList",
    type: "GET",
    success: function (data) {
      loadingScreen.style.display = "none";
      $('#customerListId').empty();
      data.forEach(function (cust) {

        const newRow = $('<tr>').append(
          $('<td>').text(cust.arAcCde).css('padding', '14px 12px'),
          $('<td>').text(cust.arNme).css('padding', '14px 12px'),
          $('<td>').text(cust.addr).css('padding', '14px 12px'),
          $('<td>').text(cust.phone).css('padding', '14px 12px'),
        );
        newRow.on('click', function () {
          $('#inputCustomer').val(cust.arNme);
          $('#inputPaymentCustomer').val(cust.arNme);
          $('#hiddenCustId').val(cust.arId);
        }).css('cursor', 'pointer');

        $('#customerListId').append(newRow);
      });
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function closeCustomerModal() {
  $('#customerModal').hide();
}


/*Payment*/


function choosePayment() {
  const paymentTypeTable = $('#paymentTypeBodyId');
  const paymentTable = $('#paymentTableBodyId');

  paymentTypeTable.empty(); // empty payment type table data first
  paymentTable.empty(); // empty payment table data
  calculateChangeAmount();

  $.ajax({
    url: "/Sale/GetCurrencies",
    type: "GET",
    dataType: "html",
    success: function (currencies) {
      var parsedCurrencies = JSON.parse(currencies);
      parsedCurrencies.forEach(function (currency) {
        const newRow = $('<tr>').attr('id', 'pay-' + currency.currId)
          .append($('<td>').text(currency.currTyp).css('padding', '14px 12px'));
        newRow.on('click', function () {
          addCurrency(currency.currId, currency.currTyp);
        }).css('cursor', 'pointer');

        paymentTypeTable.append(newRow);
      });
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function addCurrency(currId, currTyp) { // Add payment
  const clickedPayType = $('#pay-' + currId); // hiding row after clicked
  clickedPayType.hide();

  const paymentTbl = $('#paymentTableBodyId');
  const paymentTable = document.getElementById('paymentTable');
  const newRow = $('<tr>');
  var tdPayCurrTyp = $('<td>').text(currTyp).css('padding', '14px 12px');
  newRow.append(tdPayCurrTyp);

  if (paymentTable.rows.length <= 1) {
    const netAmountDisplay = $('#paymentNetAmountDisplayId');
    var formattedNetAmount = netAmountDisplay.val().replace(',', '');
    formattedNetAmount = calculateLocalAmount(currId, formattedNetAmount);

    var tdPayAmt = $('<td>').text(formattedNetAmount).css({
      'padding': '14px 12px',
      'cursor': 'pointer'
    }
    );
  }
  else {
    const changeAmountDisplay = $('#changeAmountDisplayId');
    var changeAmount = changeAmountDisplay.val().replace(',', '');
    var formattedChgAmt = parseInt(changeAmount);
    if (formattedChgAmt > 0) {
      formattedChgAmt = 0;
    }
    else {
      formattedChgAmt = -formattedChgAmt;
    }
    formattedChgAmt = calculateLocalAmount(currId, formattedChgAmt);
    var tdPayAmt = $('<td>').text(formattedChgAmt).css({
      'padding': '14px 12px',
      'cursor': 'pointer'
    }
    );
  }

  // payment modal Numberpad
  const payNumberPad = document.getElementById('numberPad');
  const display = $('#display');
  const buttons = $('.number-pad button');
  var fstClkFlg = false;

  function handleButtonClick(buttonText) { //numberpad for payment
    switch (buttonText) {

      case 'C':
        display.val('');
        break;

      case 'Enter':
        if (display.val() === "") {
          display.val('0');
        }
        tdPayAmt.text(display.val());
        display.val('');
        payNumberPad.style.display = 'none';
        fstClkFlg = false;
        calculateChangeAmount();
        break;

      case 'X':
        display.val('');
        payNumberPad.style.display = 'none';
        fstClkFlg = false;
        break;

      default:
        if (!fstClkFlg) {
          display.val('');
          fstClkFlg = true;
        }
        display.val(display.val() + buttonText);
    }

  }

  // Clickable pay amount
  tdPayAmt.on('click', function () {
    payNumberPad.style.display = "grid";
    display.val(tdPayAmt.text());
    buttons.off('click').on('click', function () {
      const buttonText = this.textContent;
      handleButtonClick(buttonText);
    })
  })
  newRow.append(tdPayAmt);

  // Cancel Btn
  var tdPayCancel = $('<i>').addClass('fas fa-times fa-2x').css({
    'cursor': 'pointer',
    'color': 'red',
    'padding': '14px'
  });
  tdPayCancel.on('click', function () {
    var deletedCurrType = $(this).closest('tr').find('td:first').text();
    $(this).closest('tr').remove();
    showCurrencyTypeBack(deletedCurrType);
    calculateChangeAmount();
  });

  newRow.append(tdPayCancel);

  paymentTbl.append(newRow);
  calculateChangeAmount();
}

function calculateLocalAmount(currId, amount) {
  var localAmount = null;

  $.ajax({
    type: 'POST',
    url: '/Sale/FindCurrencyById',
    data: {
      currId: currId
    },
    async: false, // Make the request synchronous
    success: function (currency) {
      localAmount = amount / currency.currRate;
      localAmount = localAmount.toFixed(0);
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

  return localAmount;
}

function calculateChangeAmount() {
  const netAmountDisplay = $('#paymentNetAmountDisplayId');
  const changeAmountDisplay = $('#changeAmountDisplayId');
  const tableCells = $('#paymentTableBodyId tr td');
  const totalColumn = 2;
  const amountColumn = 1;
  let changeAmount = 0;
  let payAmount = 0;

  tableCells.each(function (index) {
    if (index === amountColumn || (index % totalColumn === amountColumn)) {
      const currType = tableCells.eq(index - 1).text();
      $.ajax({
        type: 'POST',
        url: '/Sale/FindCurrency',
        data: {
          currType: currType
        },
        success: function (currency) {
          const localAmount = parseInt(tableCells.eq(index).text()) * parseInt(currency.currRate);
          payAmount += localAmount;
          changeAmount = payAmount - parseInt(netAmountDisplay.val().replace(',', ''));
          changeAmountDisplay.val(changeAmount.toLocaleString());
        },
        error: function () {
          alert('Session Expired!');
          window.location.href = '/LogIn/Index';  // Redirect to login
        }
      });
    }
  });

  if (tableCells.length <= 0) {
    changeAmount = -parseInt(netAmountDisplay.val().replace(',', ''));
    changeAmountDisplay.val(changeAmount.toLocaleString());
  }
}

function showCurrencyTypeBack(currType) { // showing removed currType again after clicked cancel btn
  $.ajax({
    type: 'POST',
    url: '/Sale/FindCurrency',
    data: {
      currType: currType
    },
    success: function (currency) {
      const clickedPayType = $('#pay-' + currency.currId);
      clickedPayType.show();
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

}

function addAllDataToTables() {
  const billNo = $('#billNoId').val();
  const disc = $('#billDiscount').val();
  const changeAmt = $('#changeAmountDisplayId').val();
  const custId = $('#hiddenCustId').val();
  const custNme = $('#inputCustomer').val();
  const tableNo = $('#inputSelectedTableNo').val();

  // Sale Table

  const saleTableData = [];
  const saleTable = document.getElementById('saleTable');

  // Loop through all rows (start from index 1 to skip the table header)
  for (let i = 1; i < saleTable.rows.length; i++) {
    const row = saleTable.rows[i];
    const rowData = [];

    // Loop through all cells in the row
    for (let j = 0; j < row.cells.length; j++) {

      if (j === 1) { // push itemid not itemdesc
        rowData.push(row.cells[j].id);
      }
      else {
        rowData.push(row.cells[j].textContent);
      }

    }
    var specInstr = $(row.cells[1]).find('span').text();
    specInstr = specInstr.replace(/[()]/g, '');
    rowData.push(specInstr);

    // Push the row data into the tableData array
    saleTableData.push(rowData);
  }

  // Payment Table

  const paymentTableData = [];
  const paymentTable = document.getElementById('paymentTable');

  // Loop through all rows (start from index 1 to skip the table header)
  for (let i = 1; i < paymentTable.rows.length; i++) {
    const row = paymentTable.rows[i];
    const rowData = [];

    // Loop through all cells in the row
    for (let j = 0; j < row.cells.length; j++) {
      if (row.cells[j].textContent === 'INV' && $('#inputPaymentCustomer').val() === 'Customer') {
        alert('Choose Customer first');
        return;
      }
      rowData.push(row.cells[j].textContent);
    }

    // Push the row data into the tableData array
    paymentTableData.push(rowData);
  }

  if (saleTableData.length > 0) {
    if (paymentTableData.length > 0) {
      $.ajax({
        type: 'POST',
        url: '/Sale/PaidBillToBillH',
        data: {
          billNo: billNo,
          discAmt: disc,
          changeAmt: changeAmt,
          custId: custId,
          custNme: custNme,
          tableNo: tableNo,
          saleTableData: saleTableData,
          paymentTableData: paymentTableData
        },
        success: function () {
          clearAll();
          printBillSlip(billNo);
        },
        error: function () {
          alert('Session Expired!');
          window.location.href = '/LogIn/Index';  // Redirect to login
        }
      });
    }
    else {
      alert('Please choose payment type first');
    }
  }
  else {
    alert('Please choose stock item first');
  }
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
        alert('Error occured.');
        return;
      }
      location.reload();
    },
    error: function (error) {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}


/*Return*/


function openReturnModal() {
  const returnTable = $('#returnTableBodyId');

  returnTable.empty(); // empty return table data

  const newRow = $('<tr>');
  var tdReturnCurrTyp = $('<td>').text('SRTN').css('padding', '14px 12px');
  newRow.append(tdReturnCurrTyp);

  const netAmountDisplay = $('#paymentNetAmountDisplayId');
  var formattedNetAmount = netAmountDisplay.val().replace(',', '');
  var tdReturnAmt = $('<td>').text(formattedNetAmount).css({
    'padding': '14px 12px',
    'cursor': 'pointer'
  }
  );

  // payment modal Numberpad
  const payNumberPad = document.getElementById('numberPad');
  const display = $('#display');
  const buttons = $('.number-pad button');

  function handleButtonClick(buttonText) { //numberpad for return
    if (buttonText === 'C') {
      display.val('');
    } else if (buttonText === 'Enter') {
      if (display.val() === "") {
        display.val('0');
      }
      tdReturnAmt.text(display.val());
      display.val('');
      payNumberPad.style.display = 'none';
    } else if (buttonText === 'X') {
      display.val('');
      payNumberPad.style.display = 'none';
    } else {
      if (display.val() === tdReturnAmt.text()) {
        display.val('');
      }
      display.val(display.val() + buttonText);
    }
  }
  // Clickable return amount
  tdReturnAmt.on('click', function () {
    payNumberPad.style.display = "grid";
    display.val(tdReturnAmt.text());
    buttons.off('click').on('click', function () {
      const buttonText = this.textContent;
      handleButtonClick(buttonText);
    })
  })
  newRow.append(tdReturnAmt);
  returnTable.append(newRow);
}


function addAllReturnDataToTables() {
  const billNo = $('#billNoId').val();
  const disc = $('#billDiscount').val();
  const remark = $('#returnRemarkID').val();
  const custId = $('#hiddenCustId').val();
  const custNme = $('#inputCustomer').val();

  // Sale Table

  const saleTableData = [];
  const saleTable = document.getElementById('saleTable');

  // Loop through all rows (start from index 1 to skip the table header)
  for (let i = 1; i < saleTable.rows.length; i++) {
    const row = saleTable.rows[i];
    const rowData = [];

    // Loop through all cells in the row
    for (let j = 0; j < row.cells.length; j++) {
      if (j === 1) { // push itemid not itemdesc
        rowData.push(row.cells[j].id);
      }
      else {
        rowData.push(row.cells[j].textContent);
      }
    }

    // Push the row data into the tableData array
    saleTableData.push(rowData);
  }

  // Payment Table

  const returnTableData = [];
  const returnTable = document.getElementById('returnTable');

  // Loop through all rows (start from index 1 to skip the table header)
  for (let i = 1; i < returnTable.rows.length; i++) {
    const row = returnTable.rows[i];
    const rowData = [];

    // Loop through all cells in the row
    for (let j = 0; j < row.cells.length; j++) {
      rowData.push(row.cells[j].textContent);
    }

    // Push the row data into the tableData array
    returnTableData.push(rowData);
  }

  if (saleTableData.length > 0) {
    if (returnTableData.length > 0) {
      $.ajax({
        type: 'POST',
        url: '/Sale/ReturnBillToBillH',
        data: {
          billNo: billNo,
          discAmt: disc,
          custId: custId,
          custNme: custNme,
          remark: remark,
          saleTableData: saleTableData,
          returnTableData: returnTableData
        },
        success: function (response) {
          clearAll();
          printBillSlip(billNo);
        },
        error: function () {
          alert('Session Expired!');
          window.location.href = '/LogIn/Index';  // Redirect to login
        }
      });
    }
    else {
      alert('Please choose payment type first');
    }
  }
  else {
    alert('Please choose stock item first');
  }
}


/* Bill to Room*/

function openBillToRoomModal() {

  var model = $('#billToRoomModal');
  model.show();
  const table = $('#billToRoomTableBody');

  const loadingScreen = document.getElementById('tableLoadingScreen');
  loadingScreen.style.display = "block";

  $.ajax({
    url: "/Sale/GetInHouseRoomList",
    type: "GET",
    success: function (data) {
      loadingScreen.style.display = "none";
      table.empty();
      data.forEach(function (bill) {

        const newRow = $('<tr>').append(
          $('<td>').text(bill.roomNo).css('padding', '14px 12px'),
          $('<td>').text(bill.guestName).css('padding', '14px 12px')
        );

        newRow.on('click', function () {
          $('#inputBtRGuest').val(bill.guestName);
          $('#inputBtRRoomNo').val(bill.roomNo);
          openCashType(bill.checkInId);
        }).css('cursor', 'pointer');

        table.append(newRow);
      });
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function openCashType(checkinid) {
  closeBillToRoomModal();

  $('#btrPaymentModal').show();

  const paymentTypeTable = $('#btrPaymentTypeBodyId');
  const paymentTable = $('#btrPaymentTableBodyId');

  paymentTypeTable.empty(); // empty payment type table data first
  paymentTable.empty(); // empty payment table data

  $.ajax({
    url: "/Sale/GetBillToRoomCurrencies",
    type: "GET",
    success: function (currencies) {
      currencies.forEach(function (currency) {
        const newRow = $('<tr>').attr('id', 'pay-' + currency.currId)
          .append($('<td>').text(currency.currTyp).css('padding', '14px 12px'));
        newRow.on('click', function () {
          addBTRCurrency(currency.currId, currency.currTyp);
        }).css('cursor', 'pointer');

        paymentTypeTable.append(newRow);
      });
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

  var folioData = {
    checkInId: checkinid
  }

  $.ajax({
    url: "/Sale/GetFolios",
    type: "GET",
    data: folioData,
    success: function (folios) {
      $('#selectFolio').find('option').remove();
      $('#selectFolio').append($('<option>').text('Main Folio').val('MF'));
      folios.forEach(function (folio) {
        const newOption = $('<option>').text(folio.foliodesc).val(folio.foliocde);
        $('#selectFolio').append(newOption);
      });
    },
    error: function () {
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function addBTRCurrency(currId, currTyp) { // Add payment

  const clickedPayType = $('#pay-' + currId); // hiding row after clicked
  clickedPayType.hide();

  const paymentTbl = $('#btrPaymentTableBodyId');

  const newRow = $('<tr>');

  var tdPayCurrTyp = $('<td>').text(currTyp).css('padding', '14px 12px');
  newRow.append(tdPayCurrTyp);

  const netAmountDisplay = $('#btrPaymentNetAmountDisplayId');
  var formattedNetAmount = netAmountDisplay.val().replace(',', '');
  formattedNetAmount = calculateLocalAmount(currId, formattedNetAmount);
  var tdPayAmt = $('<td>').text(formattedNetAmount).css({
    'padding': '14px 12px',
    'cursor': 'pointer'
  });
  newRow.append(tdPayAmt);

  // Cancel Btn
  var tdPayCancel = $('<i>').addClass('fas fa-times fa-2x').css({
    'cursor': 'pointer',
    'color': 'red',
    'padding': '14px'
  });
  tdPayCancel.on('click', function () {
    var deletedCurrType = $(this).closest('tr').find('td:first').text();
    $(this).closest('tr').remove();
    showCurrencyTypeBack(deletedCurrType);
  });

  newRow.append(tdPayCancel);

  paymentTbl.append(newRow);
  calculateChangeAmount();
}

function billToRoom() {

  const roomNo = $('#inputBtRRoomNo').val();
  const billNo = $('#billNoId').val();
  const disc = $('#billDiscount').val();
  const changeAmt = $('#btrChangeAmountDisplayId').val();
  const custId = $('#hiddenCustId').val();
  const custNme = $('#inputBtRGuest').val();
  const folioCde = $('#selectFolio').val();

  // Sale Table
  const saleTableData = [];
  const saleTable = document.getElementById('saleTable');

  for (let i = 1; i < saleTable.rows.length; i++) {
    const row = saleTable.rows[i];
    const rowData = [];

    for (let j = 0; j < row.cells.length; j++) {
      if (j === 1) { // push itemid not itemdesc
        rowData.push(row.cells[j].id);
      }
      else {
        rowData.push(row.cells[j].textContent);
      }
    }
    saleTableData.push(rowData);
  }

  // Payment Table
  const paymentTableData = [];
  const paymentTable = document.getElementById('btrPaymentTable');

  for (let i = 1; i < paymentTable.rows.length; i++) {
    const row = paymentTable.rows[i];
    const rowData = [];

    for (let j = 0; j < row.cells.length; j++) {
      rowData.push(row.cells[j].textContent);
    }

    paymentTableData.push(rowData);
  }

  if (saleTableData.length > 0) {
    if (paymentTableData.length > 0) {
      $.ajax({
        type: 'POST',
        url: '/Sale/PaidBillToBillH',
        data: {
          billNo: billNo,
          discAmt: disc,
          changeAmt: changeAmt,
          custId: custId,
          custNme: custNme,
          saleTableData: saleTableData,
          paymentTableData: paymentTableData
        },
        success: function () {

          clearAll();
          printBillSlip(billNo);

          var allInputData = {
            roomNo: roomNo,
            billNo: billNo,
            discAmt: disc,
            folioCde: folioCde,
            saleTableData: saleTableData
          };

          $.ajax({
            url: "/Sale/BillToRoom",
            type: 'POST',
            data: allInputData,
            success: function () {
              alert('Successfully send bill to ' + roomNo);
              location.reload();
            },
            error: function () {
              closeCashType();
              alert('Session Expired!');
              window.location.href = '/LogIn/Index';  // Redirect to login

            }
          });

        },
        error: function (error) {
          alert('Error occured.');
        }
      });
    }
    else {
      alert('Please choose payment type first');
    }
  }
  else {
    alert('Please choose stock item first');
  }



}

function closeBillToRoomModal() {
  var model = $('#billToRoomModal');
  model.hide();
}

function closeCashType() {
  $('#btrPaymentModal').hide();
}



/*** Stock item field ***/


function changeStocks(categoryId) {
  var loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.style.display = "block";

  var inputData = {
    catgId: categoryId
  };

  $.ajax({
    url: "/Sale/StockItems",
    type: "GET",
    dataType: "html",
    data: inputData,
    success: function (data) {
      $('#tableContainer').html(data);
      loadingScreen.style.display = "none";
    },
    error: function (data) {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });

}


function allStocks() {
  var loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.style.display = "block";
  $.ajax({
    url: "/Sale/AllStockItems",
    type: "GET",
    dataType: "html",
    success: function (data) {
      $('#tableContainer').html(data);
      loadingScreen.style.display = "none";
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function assemblyStocks() {
  var loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.style.display = "block";
  $.ajax({
    url: "/Sale/AssemblyStockItems",
    type: "GET",
    dataType: "html",
    success: function (data) {
      $('#tableContainer').html(data);
      loadingScreen.style.display = "none";
    },
    error: function (data) {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}


function packageStocks() {
  var loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.style.display = "block";
  $.ajax({
    url: "/Sale/PackageStockItems",
    type: "GET",
    dataType: "html",
    success: function (data) {
      $('#tableContainer').html(data);
      loadingScreen.style.display = "none";
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}

function searchStock(keyword) {
  var loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.style.display = "block";

  var inputData = {
    keyword: keyword
  };

  $.ajax({
    url: "/Sale/SearchItems",
    type: "GET",
    dataType: "html",
    data: inputData,
    success: function (data) {
      $('#tableContainer').html(data);
      loadingScreen.style.display = "none";
    },
    error: function () {
      loadingScreen.style.display = "none";
      alert('Session Expired!');
      window.location.href = '/LogIn/Index';  // Redirect to login
    }
  });
}




/**************************/
