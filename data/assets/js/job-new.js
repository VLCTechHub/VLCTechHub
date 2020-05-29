Site.Job = Site.Job || {}
Site.Job.New = {}
Site.Job.New.init = function() {
  function $E(selector) {
    return document.querySelector(selector)
  }

  function buildJobAPIData() {
    let data = {
      title: $E('#title').value,
      description: removeHTLM($E('#description').value),
      how_to_apply: $E('#howToApply').value,
      link: $E('#sourceUrl').value,
      salary: $E('#salary').value,
      company: {
        name: $E('#companyName').value,
        link: $E('#companyWeb').value,
        twitter: $E('#companyTwitter').value
      },
      tags: ($E('#keywords').value || '').split(','),
      contact_email: $E('#companyContact').value
    }
    return data
  }

  function removeHTLM(text) {
    const div = document.createElement('div')
    div.innerHTML = text
    return div.textContent || div.innerText || ''
  }

  function clearForm() {
    let fields = [
      '#title',
      '#description',
      '#keywords',
      '#salary',
      '#howToApply',
      '#sourceUrl',
      '#companyName',
      '#companyWeb',
      '#companyTwitter',
      '#companyContact'
    ]
    fields.forEach(field => {
      $E(field).value = ''
    })
    $form.removeAttribute('data-submit-attempted')
  }

  function showValidationErrors() {
    $form.setAttribute('data-submit-attempted', true)
    $form.querySelector(':invalid').focus()
  }

  function showOKMessage() {
    $E('.notification.success').style.display = 'block'
    $E('.notification.error').style.display = 'none'
    $E('header .title').scrollIntoView({ behaviour: 'smooth', block: 'end' })
  }

  function showKOMessage() {
    $E('.notification.success').style.display = 'none'
    $E('.notification.error').style.display = 'block'
    $E('header .title').scrollIntoView({ behaviour: 'smooth', block: 'end' })
  }

  function submitEvent() {
    if (!$form.checkValidity()) {
      showValidationErrors()
      return false
    }

    fetch(Site.API_ROOT + '/jobs/', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildJobAPIData())
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Response not ok')
        }
      })
      .then(() => {
        clearForm()
        showOKMessage()
      })
      .catch(() => {
        showKOMessage()
      })
    return false
  }

  function removeWhiteSpaces(event) {
    let rgxMoney = /^[$]?([0-9]{1,3}.([0-9]{3}.)*[0-9]{3}|[0-9]+)(.[0-9][0-9])?$|([0-9]{1,3}.([0-9]{3}.)*[0-9]{3}|[0-9]+)(.[0-9][0-9])?k/
    let valueMoney = event.target.value
    if (!rgxMoney.test(valueMoney)) {
      $E('#new-job #salary').value = ''
    }
  }

  let $form = $E('#new-job form')
  $form.querySelector('button[data-type="submit"]').addEventListener('click', submitEvent)
  $E('#new-job #salary').addEventListener('change', removeWhiteSpaces)
}
