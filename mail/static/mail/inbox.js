document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    // Form's submit
    document.querySelector('#compose-form').onsubmit = send_mail;

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#letter-view').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#letter-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            // Print emails
            console.log(emails);

            // ... do something else with emails ...
            emails.forEach(element => show_mail(element));

        }).catch(error => {
        console.log('Error:', error);
    });
}

function send_mail() {
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
    })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result);
            load_mailbox('sent');
        })
        // Catch any errors and log them to the console
        .catch(error => {
            console.log('Error:', error);
        });
    // Prevent default submission
    return false;
}

function show_mail(mail) {
    const element = document.createElement('div');
    if (mail.read) {
        element.className = 'list-group-item list-group-item-action list-group-item-secondary';
    } else {
        element.className = 'list-group-item list-group-item-action';
    }
    element.innerHTML = `<strong>FROM:</strong> ${mail.sender} ` +
        `<strong>SUBJECT:</strong> ${mail.subject} <strong>TIME:</strong> ${mail.timestamp}`;
    element.addEventListener('click', function () {
        // Do something with element
        if (document.querySelector('#emails-view h3').innerHTML === 'Sent') {
            show_letter(mail.id, false);
        } else {
            show_letter(mail.id);
        }

        change_status(mail.id, {read: true});
    });
    document.querySelector('#emails-view').append(element);
}

function show_letter(id, checkSent = true) {
    // Show the letter and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#letter-view').style.display = 'block';
    document.querySelector('#letter-view').replaceChildren();

    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(letter => {
            const element = document.createElement('div');
            element.innerHTML = `<h6><strong>FROM: </strong>${letter.sender}</h6>` +
                `<h6><strong>TO: </strong>${letter.recipients}</h6>` +
                `<h6><strong>SUBJECT: </strong>${letter.subject}</h6>` +
                `<h6><strong>TIME: </strong>${letter.timestamp}</h6>`;
            document.querySelector('#letter-view').append(element);
            if (checkSent) {
                const buttonArchived = document.createElement('button');
                buttonArchived.className = 'btn btn-outline-info btn-sm mr-1';
                buttonArchived.innerText = letter.archived ? 'Unarchive' : 'Archive';
                buttonArchived.addEventListener('click', function () {
                    const markArchived = letter.archived ? {archived: false} : {archived: true};
                    change_status(letter.id, markArchived)
                    load_mailbox('inbox');
                });
                document.querySelector('#letter-view').append(buttonArchived);

                const buttonReply = document.createElement('button');
                buttonReply.className = 'btn btn-outline-info btn-sm';
                buttonReply.innerText = 'Reply';
                buttonReply.addEventListener('click', function () {
                    reply_email(letter);
                });
                document.querySelector('#letter-view').append(buttonReply);
            }
            const textLetter = document.createElement('p');
            textLetter.innerHTML = `<br>${letter.body}`;
            document.querySelector('#letter-view').append(textLetter);

        }).catch(error => {
        console.log('Error:', error);
    });
}

function reply_email(letter) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#letter-view').style.display = 'none';

    document.querySelector('#compose-recipients').value = letter.sender;
    document.querySelector('#compose-subject').value =
        letter.subject.includes('Re: ') ? letter.subject : `Re: ${letter.subject}`;
    document.querySelector('#compose-body').value =
        `\n\nOn ${letter.timestamp} ${letter.sender} wrote:\n${letter.body}`;

}

/**
 * mark get parameter {read: true/false} to read/unread or {archived: true/false} to archived/unarchived
 * @param {Object} [mark = {read: true}] - mark an email as read
 * @param id - is the id of the email
 */
function change_status(id, mark) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify(
            mark
        )
    }).catch(error => {
        console.log('Error:', error);
    });
}