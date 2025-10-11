function copyAddress() {
  var isChecked = document.getElementById('same_as_address').checked;
  if (isChecked) {
    document.getElementById('address_line2').value =
      document.getElementById('address_line1').value;
  } else {
    document.getElementById('address_line2').value = '';
  }
}
