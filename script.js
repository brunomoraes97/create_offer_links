console.log("Hello there");

const resultsDiv = document.getElementById('results');
resultsDiv.innerHTML = ''

document.getElementById('offerUrlsForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    uploadCSV();
});

async function uploadCSV() {

    const baseURL = document.getElementById('baseUrl').value;
    const token = document.getElementById('token').value;
    const csvInput = document.getElementById('csvFile');
    const csvFile = csvInput.files[0];

    if (!token || !baseURL) {
        resultsDiv.innerHTML = '<p class="error">Error: you must provide a token and a Base URL</p>'
        return;
    }

    if (!csvFile) {
        resultsDiv.innerHTML = '<p class="error">Error: your CSV file is empty</p>'
        return;
    }

    console.log('File selected:', csvFile);

    if (typeof Papa === 'undefined') {
        resultsDiv.innerHTML = '<p class="error">Could not connect to Papa Parser</p>'
        return;
    }

    Papa.parse(csvFile, {

        header: true,
        complete: async function (results) {
            console.log('CSV parsing complete:', results);
            const offerUrls = results.data.filter(row => Object.values(row).some(value => value));
            resultsDiv.innerHTML = '';

            for (const offerUrl of offerUrls) {
                try {
                    const response = await createOfferUrl(offerUrl, baseURL, token);
                    console.log("Response:", response);
                    if (response.status !== 200) {
                        resultsDiv.innerHTML += `<p class="error">Failed to create offer URL: ${offerUrl.id} (HTTP Status: ${response.status})</p>`;
                    } else {
                        resultsDiv.innerHTML += `<p class="success">Successfully created offer: ${offerUrl.id}</p>`;
                    }
                } catch (error) {
                    console.error('Error creating Offer URL:', error);
                }
            }
        }


    })

    async function createOfferUrl(offerUrl, baseURL, token) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(offerUrl)) {
            if (value) {
                queryParams.append(key,value);
            }
        }
        const offerId = queryParams.get('offer_id');
        queryParams.delete('offer_id');
        const url = `${baseURL}/backend/open-api/v1/users/offers/${offerId}/urls?${queryParams.toString()}`;
        console.log('Sending request to: ', url)

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Connection': 'keep-alive'
            },
            redirect: "follow"
        });

        if (!response.ok) {
            console.error('Error response:', response.status, response.statusText, response);
            return response;
        }
    
        const responseData = await response.json();
        console.log('Response data:', responseData);
        return responseData;
    }

}