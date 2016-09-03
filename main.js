/**
 * Created by Вероника on 03.09.2016.
 */

// Дождёмся загрузки API и готовности DOM.
ymaps.ready(init);

function init () {
    let myMap;
    // Создание экземпляра карты и его привязка к контейнеру с
    // заданным id ("map").
    myMap = new ymaps.Map('map', {
        // При инициализации карты обязательно нужно указать
        // её центр и коэффициент масштабирования.
        center: [55.76, 37.64], // Москва
        zoom: 10
    });

    // Слушаем клик на карте.
    myMap.events.add('click', function (e) {
        var coords = e.get('coords');

        createBaloon(coords);
        // let myPlacemark = createPlacemark(coords);
        // myMap.geoObjects.add(myPlacemark);
        // getAddress(myPlacemark, coords);
    });

    // Создание метки.
    function createPlacemark(coords) {
        return new ymaps.Placemark(coords, {
            iconCaption: 'поиск...'
        }, {
            iconLayout: 'default#image',
            iconImageHref: 'images/active.png'
        });
    }

    // Определяем адрес по координатам (обратное геокодирование).
    function getAddress(myPlacemark, coords) {
        myPlacemark.properties.set('iconCaption', 'поиск...');
        ymaps.geocode(coords).then(function (res) {
            var firstGeoObject = res.geoObjects.get(0);
            console.log(firstGeoObject.properties.get('name'), firstGeoObject.properties.get('text'));

            myPlacemark.properties
                .set({
                    iconCaption: firstGeoObject.properties.get('name'),
                    balloonContent: firstGeoObject.properties.get('text')
                });
        });
    }

    // Открываем балун на карте (без привязки к геообъекту).
    function createBaloon(coords) {
        ymaps.geocode(coords).then(function (res) {
            let firstGeoObject = res.geoObjects.get(0);
            console.log(firstGeoObject.properties.get('name'), firstGeoObject.properties.get('text'));

            myMap.balloon.open(coords, {
                // contentHeader: firstGeoObject.properties.get('text'),
                contentBody:
                "<p id=\"address\">" + firstGeoObject.properties.get('text') + "</p>" +
                "<input type='text' name='name'>" +
                "<input type='text' name='place'>" +
                "<textarea name='comment'></textarea>" +
                "<button class='add-button'>Добавить</button>"
            },{
                contentBodyLayout: ymaps.templateLayoutFactory.createClass(
                    "<div id=\"main-div\">" +
                    "$[data.contentBody]" +
                    "</div>"
                )
            });
        });
    }
}