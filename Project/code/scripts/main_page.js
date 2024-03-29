window.onload = main;

let products = [];

async function main() {
    await updateProducts();

    const menuButton = document.querySelector(".topbar .menu");
    menuButton.addEventListener('click', toggleSidebar);

    const filters = await getFilters();

    const sidebarEl = document.querySelector('.sidebar');

    for (const { name, options } of filters) {
        const filterItemEl = constructFilterItem(name, options);
        sidebarEl.appendChild(filterItemEl);
    }

    const searchBtn = document.querySelector('.search-btn');
    searchBtn.addEventListener('click', async () => {
        await updateProducts();
        toggleSidebar();
    });

    const exportCSVBtn = document.querySelector('.csv-export');
    exportCSVBtn.addEventListener('click', () => generateCSV());

    const exportJSONBtn = document.querySelector('.json-export');
    exportJSONBtn.addEventListener('click', () => generateJSON());
}

function generateCSV() {
    const header = ['name', 'price', 'seller_id', 'category_name', 'user_description', 'image_url', 'soil', 'temperature', 'humidity', 'water', 'season', 'quantity'];

    let content = '';

    const appendRow = row => {
        content += row.map(item => {
            const field = (item ? item.toString() : '');
            return field.indexOf(',') === -1 ? field : "\"" + field + "\"";
        }).join(',') + '\n';
    };

    appendRow(header);

    for (const product of products) {
        const optimal_parameters = product.flower_data.optimal_parameters;
        const row = [product.name, product.price, product.seller_id, product.category_name, product.user_description, product.image_url,
        optimal_parameters.soil, optimal_parameters.temperature, optimal_parameters.humidity, optimal_parameters.water, product.flower_data.season, product.quantity];

        appendRow(row);
    }

    const blob = new Blob([content], { type: 'text/plain' });

    const downloadLink = document.createElement('a');
    const url = window.URL.createObjectURL(blob);

    downloadLink.href = url;
    downloadLink.download = 'products.csv';
    downloadLink.click();

    window.URL.revokeObjectURL(url);
}

function generateJSON() {
    const blob = new Blob([JSON.stringify(products)], { type: 'application/json' });

    const downloadLink = document.createElement('a');
    const url = window.URL.createObjectURL(blob);

    downloadLink.href = url;
    downloadLink.download = 'products.json';
    downloadLink.click();

    window.URL.revokeObjectURL(url);
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar.classList.contains('sidebar-closed')) {
        sidebar.classList.remove('sidebar-closed');
        sidebar.classList.add('sidebar-open');
    } else {
        sidebar.classList.remove('sidebar-open');
        sidebar.classList.add('sidebar-closed');
    }
}

async function updateProducts() {
    const queryData = getQueryData();
    const query = urlEncode(queryData);

    products = await retrieveProducts(query);
    const itemsElement = document.querySelector(".items");
    itemsElement.innerHTML = '';
    for (const product of products) {
        const element = constructProductElement(product);
        itemsElement.append(element);
    }
}

function getQueryData() {
    const filterItems = document.querySelectorAll('.sidebar .filter-item');

    const queryData = {};

    for (const filterItem of filterItems) {
        const selectEl = filterItem.querySelector('select');
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        if (selectedOption.value === 'default') {
            continue;
        }

        const name = selectEl.name;
        const value = selectedOption.text;
        queryData[name] = value;
    }

    const searchInput = document.querySelector('.searchbar input');
    queryData['name'] = searchInput.value.trim();
    return queryData;
}

async function getFilters() {
    const res = await fetch('/filters');
    return await res.json();
}

function beautifyProperty(property) {
    property = property.replace('_', ' ');
    return property;
}

function constructProductElement(product) {
    const template = `
        <div class="selling-item">
            <div class="img-wrapper">
                <img src="" alt="">
            </div>
            <div class="right-wrapper">

                <div class="item-info">
                    <div class="item-content">
                        <a class="title-link" href="">
                            <h3 class="title"></h3>
                        </a>

                        <p class="description"></p>
                    </div>
                    <div class="item-price"></div>
                </div>

                <div class="controls">
                    <button class="watch">
                        <div class="img-wrapper">
                            <img src="../icons/eye.png" alt="">
                        </div>
                    </button>
                    <button class="cart">
                        <div class="img-wrapper">
                            <img src="../icons/shopping.png" alt="">
                        </div>
                    </button>
                </div>

            </div>
        </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = template;

    element.querySelector('.img-wrapper img').src = product.image_url;
    element.querySelector('.title').textContent = product.name;
    element.querySelector('.description').textContent = product.user_description;
    element.querySelector('.item-price').textContent = product.price + '$';

    const productHandle = getProductHandle(product);

    element.querySelector('.title-link').href = '/html/product.html?flower_id=' + product._id;

    element.querySelector('.cart').onclick = async () => {
        await fetch('/cart_products', {
            method: 'POST',
            body: JSON.stringify(productHandle),
            headers: {
                'content-type': 'application/json'
            }
        });
        window.location.href = '/html/shopping_cart.html';
    }

    element.querySelector('.watch').addEventListener('click', function (){addProductToWatchlist(product);});

    return element;
}

function constructFilterItem(name, options) {
    const filterItem = document.createElement('div');
    filterItem.classList.add('filter-item');

    const labelEL = document.createElement('label');
    labelEL.htmlFor = name;

    const beautifulName = beautifyProperty(name);
    labelEL.textContent = beautifulName[0].toUpperCase() + beautifulName.slice(1) + ':';
    filterItem.appendChild(labelEL);

    const selectEl = document.createElement('select');
    selectEl.name = name;
    selectEl.id = name;
    filterItem.appendChild(selectEl);

    const defaultOptionEl = document.createElement('option');
    defaultOptionEl.value = 'default';
    defaultOptionEl.text = 'Select ' + beautifyProperty(name);
    selectEl.appendChild(defaultOptionEl);

    for (const option of options) {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.text = beautifyProperty(option);
        selectEl.appendChild(optionEl);
    }
    return filterItem;
}

async function retrieveProducts(query) {
    const res = await fetch('/products?' + query);
    return await res.json();
}

function getProductHandle(product) {
    const productHandle = {
        category_name: product.category_name,
        name: product.name,
        seller_id: product.seller_id,
        price: product.price,
    };
    return productHandle;
}

function urlEncode(payload) {
    const components = [];
    for (const key in payload) {
        const component = encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]);
        components.push(component);
    }
    return components.join('&');
}

async function addProductToWatchlist(product)
{
    const watchBody = { 'flower_id': product._id };

    try{
        const response = await fetch('/add-to-watchlist', {
            method: 'POST',
            body: JSON.stringify(watchBody),
            headers: {
                'content-type': 'application/json'
            }
        });

        console.log(response);
    } catch(error) {
        console.log(error);
    }
}