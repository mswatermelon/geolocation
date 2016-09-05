/**
 * Created by Вероника on 03.09.2016.
 */

// Дождёмся загрузки API и готовности DOM.
ymaps.ready(init);

function init () {
    let myMap, cluster, customItemContentLayout, placemarks = {};
    // Создание экземпляра карты и его привязка к контейнеру с
    // заданным id ("map").

    myMap = new ymaps.Map('map', {
        // При инициализации карты обязательно нужно указать
        // её центр и коэффициент масштабирования.
        center: [55.76, 37.64], // Москва
        zoom: 10
    });

    // Создаем собственный макет с информацией о выбранном геообъекте.
   customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        '<div class="ballon-place"><b>{{ properties.mainComment.place|raw }}</b></div>' +
        '<a href=# data-adress="{{ properties.mainComment.address }}" ' +
        'class="list_item">{{ properties.mainComment.address|raw }}</a>' +
        '<div class="balloon-comment">{{ properties.mainComment.comment|raw }}</div>' +
        '<div class="balloon">{{ properties.mainComment.date|raw }}</div>'
    );

    clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        preset: 'islands#invertedOrangeClusterIcons',
        clusterOpenBalloonOnClick: true,
        // Устанавливаем стандартный макет балуна кластера "Карусель".
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        // Устанавливаем собственный макет.
        clusterBalloonItemContentLayout: customItemContentLayout,
        // Устанавливаем режим открытия балуна.
        // В данном примере балун никогда не будет открываться в режиме панели.
        clusterBalloonPanelMaxMapArea: 0,
        // Устанавливаем размеры макета контента балуна (в пикселях).
        clusterBalloonContentLayoutWidth: 230,
        clusterBalloonContentLayoutHeight: 170,
        // Устанавливаем максимальное количество элементов в нижней панели на одной странице
        clusterBalloonPagerSize: 5
    });

    // Слушаем клик на карте.
    myMap.events.add('click', function (e) {
        let coords = e.get('coords');

        createBaloon(coords);
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

    let getMainLayout = function(address){
        return "<div class='main-div'>" +
            "<p class='address'>" + address + "</p>" +
            "<a class='close-button'></a>" +
            "<div class='comments'>" +
            '{% for comment in comments %}' +
            '<p>{{ comment.header }}</p>' +
            '<p>{{ comment.name }}</p>' +
            '<p>{{ comment.text}}</p>' +
            '{% endfor %}' +
            "</div>" +
            "<div class='add-comment'>" +
            "<input type='text' name='name' placeholder='Ваше имя'>" +
            "<input type='text' name='place' placeholder='Укажите место'>" +
            "<textarea name='comment' placeholder='Поделитесь впечатлениями'></textarea>" +
            "</div>" +
            "<button class='add-button'>Добавить</button>" +
            "</div>"
    };

    let addBalloon = function(coords, adress){
        myMap.balloon.open(coords, {
            comments: placemarks[adress]
        }, {
            iconLayout: 'default#image',
            iconImageHref: 'images/active.png',
            layout: ymaps.templateLayoutFactory.createClass(
                getMainLayout(adress),
                getLayoutOptions(adress, coords)
            )
        });
    };

    let getLayoutOptions = function (address, coords) {
        return {
            // Переопределяем функцию build, чтобы при создании макета начинать
            // слушать событие click на кнопке-счетчике.
            build: function () {
                // Сначала вызываем метод build родительского класса.
                this.constructor.superclass.build.call(this);
                // А затем выполняем дополнительные действия.
                document.querySelector('.add-button').addEventListener('click', this.onButtonClick);
                document.querySelector('.close-button').addEventListener('click', this.onCloseButtonClick);
            },

            // Аналогично переопределяем функцию clear, чтобы снять
            // прослушивание клика при удалении макета с карты.
            clear: function () {
                // Выполняем действия в обратном порядке - сначала снимаем слушателя,
                // а потом вызываем метод clear родительского класса.
                document.querySelector('.close-button').addEventListener('click', this.onCloseButtonClick);
                document.querySelector('.add-button').removeEventListener('click', this.onButtonClick);
                this.constructor.superclass.clear.call(this);
            },

            onCloseButtonClick: function () {
                myMap.balloon.close();
            },

            onButtonClick: function () {
                let name = document.querySelector('input[name="name"]'),
                    place = document.querySelector('input[name="place"]'),
                    comment = document.querySelector('textarea[name="comment"]'),
                    now = new Date(),
                    newComments = [],
                    myPlacemark,
                    comments = myMap.balloon.getData().comments,
                    dateFormat = function (now) {
                        year = "" + now.getFullYear();
                        month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
                        day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
                        hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
                        minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
                        second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
                        return year + "." + month + "." + day + " " + hour + ":" + minute + ":" + second;
                    };

                for(let comm of comments){
                    if (comm.header != "Отзывов пока нет...") {
                        newComments.push(comm);
                    }
                }

                newComments.push({
                    header: `${name.value} ${place.value} ${dateFormat(now)}`,
                    text: `${comment.value}`
                });

                newMarkComment = {
                    comment: `${comment.value}`,
                    place: `${place.value}`,
                    date: `${dateFormat(now)}`,
                    address: `${address}`,
                    header: `${name.value} ${place.value} ${dateFormat(now)}`,
                    text: `${comment.value}`
                };

                myMap.balloon.setData({"comments": newComments});

                myPlacemark = new ymaps.Placemark(coords, {
                    mainComment: newMarkComment
                },{
                    iconLayout: 'default#image',
                    iconImageHref: 'images/active.png',
                    balloonLayout: ymaps.templateLayoutFactory.createClass(
                        "<div class=\"main-div\">" +
                        "<p class=\"address\">" + address + "</p>" +
                        "<a class=\"close-button\"></a>" +
                        "<div class=\"comments\">" +
                        '<p>{{ properties.mainComment.header}}</p>' +
                        '<p>{{ properties.mainComment.text}}</p>' +
                        "</div>" +
                        "<div class=\"add-comment\">" +
                        "<input type='text' name='name' placeholder='Ваше имя' disabled>" +
                        "<input type='text' name='place' placeholder='Укажите место'  disabled>" +
                        "<textarea name='comment' placeholder='Поделитесь впечатлениями'  disabled></textarea>" +
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
                                document.querySelector('.close-button').addEventListener('click', this.onCloseButtonClick);
                            },

                            // Аналогично переопределяем функцию clear, чтобы снять
                            // прослушивание клика при удалении макета с карты.
                            clear: function () {
                                // Выполняем действия в обратном порядке - сначала снимаем слушателя,
                                // а потом вызываем метод clear родительского класса.
                                document.querySelector('.close-button').addEventListener('click', this.onCloseButtonClick);
                                document.querySelector('.add-button').removeEventListener('click', this.onButtonClick);
                                this.constructor.superclass.clear.call(this);
                            },

                            onCloseButtonClick: function () {
                                myPlacemark.balloon.close();
                            },

                            onButtonClick: function () {
                                addBalloon(coords, address);
                            }
                        }
                    )
                });

                clusterer.add(myPlacemark);
                placemarks[address] = myMap.balloon.getData().comments;
            }
        }
    };

    // Открываем балун на карте (без привязки к геообъекту).
    function createBaloon(coords) {
        ymaps.geocode(coords).then(function (res) {
            let firstGeoObject = res.geoObjects.get(0);

            myMap.balloon.open(coords, {
                comments: [{header: "Отзывов пока нет..."}]
            },{
                iconLayout: 'default#image',
                iconImageHref: 'images/active.png',
                layout: ymaps.templateLayoutFactory.createClass(
                    getMainLayout(firstGeoObject.properties.get('text')),
                    getLayoutOptions(firstGeoObject.properties.get('text'), coords)
                )
            });

            myMap.geoObjects.add(clusterer);
        });
    }

    document.addEventListener('click', function (e) {
        if (e.target.dataset.adress){
            ymaps.geocode(e.target.dataset.adress, {
                /**
                 * Опции запроса
                 * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/geocode.xml
                 */
                // Сортировка результатов от центра окна карты.
                // boundedBy: myMap.getBounds(),
                // strictBounds: true,
                // Вместе с опцией boundedBy будет искать строго внутри области, указанной в boundedBy.
                // Если нужен только один результат, экономим трафик пользователей.
                results: 1
            }).then(function (res) {
                // Выбираем первый результат геокодирования.
                let firstGeoObject = res.geoObjects.get(0),
                    // Координаты геообъекта.
                    coords = firstGeoObject.geometry.getCoordinates();

                myMap.balloon.open(myMap.getCenter(), {
                    comments: placemarks[e.target.dataset.adress]
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: 'images/active.png',
                    layout: ymaps.templateLayoutFactory.createClass(
                        getMainLayout(e.target.dataset.adress),
                        getLayoutOptions(e.target.dataset.adress, coords)
                    )
                });
            });
        }
    });
}