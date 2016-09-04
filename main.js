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
        let coords = e.get('coords');

        createBaloon(coords);/*.then(function (balloon) {
            console.log(balloon);
            document.addEventListener('click', function (e) {
                if (e.target.getAttribute('class') == 'add-button'){
                    let myPlacemark = createPlacemark(coords);
                    myPlacemark.balloon = balloon;
                    balloon.close();
                    myMap.geoObjects.add(myPlacemark);
                }
            });
        });*/
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
        return ymaps.geocode(coords).then(function (res) {
            let firstGeoObject = res.geoObjects.get(0);

            let myPlacemark = new ymaps.Placemark(coords, {
                iconCaption: 'поиск...',
                comments: [{header: "Отзывов пока нет..."}]
            },{
                iconLayout: 'default#image',
                iconImageHref: 'images/active.png',
                balloonLayout: ymaps.templateLayoutFactory.createClass(
                    "<div class=\"main-div\">" +
                    "<p class=\"address\">" + firstGeoObject.properties.get('text') + "</p>" +
                    "<a class=\"close-button\"></a>" +
                    "<div class=\"comments\">" +
                    '{% for comment in properties.comments %}' +
                        '<p>{{ comment.header }}</p>' +
                        '<p>{{ comment.text}}</p>' +
                    '{% endfor %}' +
                    "</div>" +
                    "<div class=\"add-comment\">" +
                    "<input type='text' name='name' placeholder='Ваше имя'>" +
                    "<input type='text' name='place' placeholder='Укажите место'>" +
                    "<textarea name='comment' placeholder='Поделитесь впечатлениями'></textarea>" +
                    "</div>" +
                    "<button class='add-button'>Добавить</button>" +
                    "</div>", {
                        // Переопределяем функцию build, чтобы при создании макета начинать
                        // слушать событие click на кнопке-счетчике.
                        build: function () {
                            // Сначала вызываем метод build родительского класса.
                            this.constructor.superclass.build.call(this);
                            // А затем выполняем дополнительные действия.
                            document.querySelector('.add-button').addEventListener('click', this.onButtonClick);
                            console.log(this);
                        },

                        // Аналогично переопределяем функцию clear, чтобы снять
                        // прослушивание клика при удалении макета с карты.
                        clear: function () {
                            // Выполняем действия в обратном порядке - сначала снимаем слушателя,
                            // а потом вызываем метод clear родительского класса.
                            console.log(this);
                            document.querySelector('.add-button').removeEventListener('click', this.onButtonClick);
                            this.constructor.superclass.clear.call(this);
                        },

                        onButtonClick: function () {
                            let name = document.querySelector('input[name="name"]'),
                                place = document.querySelector('input[name="place"]'),
                                comment = document.querySelector('textarea[name="comment"]'),
                                now = new Date(),
                                newContent;

                            let newComments = [],
                                comments = myPlacemark.properties.get("comments");
                            console.log(comments);
                            for(let comm of comments){
                                if (comm.header != "Отзывов пока нет...") {
                                    newComments.push(comm);
                                }
                            }
                            console.log(newComments);
                            newComments.push({
                                header: `${name.value} ${place.value} ${now.toString()}`,
                                text: `${comment.value}`
                            });

                            // console.log(comments.innerHTML);
                            myPlacemark.properties.set("comments", newComments)
                        }
                    }
                )
            });

            myMap.geoObjects.add(myPlacemark);
            myPlacemark.balloon.open();
        });
    }
}