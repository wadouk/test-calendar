(function(w) {
  "use script";
  d = w.document;

  function model(calendar) {
    function initArray(array) {
      var d0 = calendar.firstDate;
      return Array.apply(null, Array(7))
        .map(function(item, x) {
          item = array[x] || {
            events: []
          };
          item.date = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + x);
          return item;
        });
    }

    function reducer(reduced, event) {
      var item = event.start_date;
      reduced[item.getDay()] = reduced[item.getDay()] || {};
      reduced[item.getDay()].events = reduced[item.getDay()].events || [];
      reduced[item.getDay()].events.push(event);
      return reduced;
    }
    return initArray(calendar.events.reduce(reducer, []))
  }

  function toDayOfWeek(date, FIRST_DAY_OF_WEEK) {
    var dayOfWeek = date.getDay();
    var year = date.getFullYear();
    var month = date.getMonth();
    return new Date(year, month, date.getDate() - dayOfWeek + FIRST_DAY_OF_WEEK)
  }

  function render(calendar) {
    function renderDays() {
      function renderDayLabel(date) {
        var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return [DAYS[date.getDay()], MONTHS[date.getMonth()], date.getDate(), date.getFullYear()].join(" ");
      }

      function pad(time) {
        return ("" + time).replace(/^\d$/, "0$&")
      }
      function renderTime(date) {
        return [date.getHours(), pad(date.getMinutes())].join(":").replace(/^(\d+):00$/, "$1h");
      }

      function time2percent(date) {
        return (((date.getHours() * 60) + date.getMinutes()) / (24 * 60)) * 100;
      }

      function duration2percent(d0, d1) {
        return time2percent(d1) - time2percent(d0);
      }

      function duration2time(duration2percent) {
        var duration = duration2percent/100*24;
        var hours = Math.floor(duration);
        var minutes = Math.round((duration - Math.floor(duration)) * 60);
        var d = new Date();
        d.setHours(hours);
        d.setMinutes(minutes)
        return renderTime(d);
      }

      function tooltip(event) {
        return renderTime(event.start_date) + "➡" + renderTime(event.end_date) + " (" + duration2time(duration2percent(event.start_date, event.end_date)) + ") " + event.title;
      }

      return calendar.model.map(function modelMap(day) {
        return {
          name: "li",
          value: [{
            name: "h2",
            value: renderDayLabel(day.date)
          }].concat({
            name: "ul",
            value: day.events.map(function eventMap(event, index, array) {
              return {
                name: "li",
                value: renderTime(event.start_date) + " - " + event.title,
                attr: {
                  title: tooltip(event),
                  alt: tooltip(event),
                  style: {
                    top: time2percent(event.start_date) + "%",
                    height: duration2percent(event.start_date, event.end_date) + "%",
                    left: (index/array.length * 100) + "%",
                    width: "calc(" + (1/array.length * 100) + "% - 2*2px - 2px)"
                  }
                }
              }
            })
          })
        }
      })
    }

    function json2dom(json) {
      function a(p, v) {
        if (v) {
          p.appendChild(v);
        } else {
          console.warn(p, "has no child");
        }
        return p;
      }
      if (!json) {
        return null;
      }
      var parent = d.createElement(json.name);
      if (json.value instanceof Array) {
        json.value.map(function(value) {
          a(parent, json2dom(value));
        });
      } else if (typeof json.value === "string") {
        a(parent, d.createTextNode(json.value));
      } else {
        a(parent, json2dom(json.value));
      }

      Object.keys((json.attr || {})).map(function mapAttr(attr) {
        var value = json.attr[attr];
        if (attr === "style") {
          value = Object.keys(value).map(function(s) {
            return s + ":" + json.attr[attr][s];
          }).join(";")
        }
        parent.setAttribute(attr, value);
      })
      return parent;
    }

    calendar.parent.appendChild(json2dom({
      name: "ul",
      value: renderDays()
    }));
  }

  w.Calendar = function Calendar(selector, firstDate, events) {
    if (!(this instanceof Calendar)) {
      return new Calendar(selector, firstDate, events);
    }
    this.parent = d.querySelector(selector);
    this.firstDate = toDayOfWeek(firstDate, 1);
    this.events = events;
    this.model = model(this);
    render(this);
  }

})(window)