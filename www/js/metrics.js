'use strict';

angular.module('emission.main.metrics',['nvd3', 'emission.services', 'ionic-datepicker', 'emission.main.metrics.factory'])

.controller('MetricsCtrl', function($scope, $ionicActionSheet, $ionicLoading,
                                    CommHelper, $window, $ionicPopup,
                                    FootprintHelper, CalorieCal) {
    $scope.uictrl = {
      showRange: false,
      showFilter: false,
      showVis: true,
      showResult: true,
      current: "Last week",
      showChart: true,
      showSummary: false,
      showMe: true,
      showAggr: false
    }
    $scope.showChart = function() {
      $scope.uictrl.showSummary = false;
      $scope.uictrl.showChart = true;
    }

    $scope.showSummary = function() {
      $scope.uictrl.showChart = false;
      $scope.uictrl.showSummary = true;
    }
    $scope.chartButtonClass = function() {
      return $scope.uictrl.showChart? "metric-chart-button-active hvcenter" : "metric-chart-button hvcenter";
    }
    $scope.summaryButtonClass = function() {
      return $scope.uictrl.showSummary? "metric-summary-button-active hvcenter" : "metric-summary-button hvcenter";
    }
    $scope.rangeButtonClass = function() {
      return $scope.uictrl.showRange? "metric-range-button-active hvcenter" : "metric-range-button hvcenter";
    }
    $scope.filterButtonClass = function() {
      return $scope.uictrl.showFilter? "metric-filter-button-active hvcenter" : "metric-filter-button hvcenter";
    }
    $scope.getButtonClass = function() {
      return ($scope.uictrl.showFilter || $scope.uictrl.showRange)? "metric-get-button hvcenter" : "metric-get-button-inactive hvcenter";
    }
    $scope.fullToggleLeftClass = function() {
      return $scope.userData.gender == 1? "full-toggle-left-active hvcenter" : "full-toggle-left hvcenter";
    }
    $scope.fullToggleRightClass = function() {
      return $scope.userData.gender == 0? "full-toggle-right-active hvcenter" : "full-toggle-right hvcenter";
    }
    $scope.fullToggleLeftClass1 = function() {
      return $scope.showca2020? "full-toggle-left-active hvcenter" : "full-toggle-left hvcenter";
    }
    $scope.fullToggleRightClass1 = function() {
      return $scope.showca2035? "full-toggle-right-active hvcenter" : "full-toggle-right hvcenter";
    }
    $scope.heightToggleLeftClass = function() {
      return $scope.userData.heightUnit == 1? "unit-toggle-left-active hvcenter" : "unit-toggle-left hvcenter";
    }
    $scope.heightToggleRightClass = function() {
      return $scope.userData.heightUnit == 0? "unit-toggle-right-active hvcenter" : "unit-toggle-right hvcenter";
    }
    $scope.weightToggleLeftClass = function() {
      return $scope.userData.weightUnit == 1? "unit-toggle-left-active hvcenter" : "unit-toggle-left hvcenter";
    }
    $scope.weightToggleRightClass = function() {
      return $scope.userData.weightUnit == 0? "unit-toggle-right-active hvcenter" : "unit-toggle-right hvcenter";
    }
    $scope.showRange = function() {
      if (!$scope.uictrl.showRange) {
        $scope.uictrl.showFilter = false;
        $scope.uictrl.showRange = true;
        $scope.uictrl.showVis = false;
        $scope.uictrl.showResult = false;
      } else {
        $scope.uictrl.showRange = false;
      }
    }
    $scope.showFilter = function() {
      if (!$scope.uictrl.showFilter) {
        $scope.uictrl.showRange = false;
        $scope.uictrl.showFilter = true;
        $scope.uictrl.showVis = false;
        $scope.uictrl.showResult = false;
      } else {
        $scope.uictrl.showFilter = false;
      }
    }

    $scope.setHeightUnit = function(heightUnit) {
      // 1 for cm, 0 for ft
      $scope.userData.heightUnit = heightUnit;
    }
    $scope.setWeightUnit = function(weightUnit) {
      // 1 for kg, 0 for lb
      $scope.userData.weightUnit = weightUnit;
    }
    $scope.setGender = function(gender) {
      $scope.userData.gender = gender;
    }

    $scope.storeUserData = function() {     
      var info = {'gender': $scope.userData.gender,
                  'heightUnit': $scope.userData.heightUnit,
                  'weightUnit': $scope.userData.weightUnit,
                  'height': $scope.userData.height,
                  'weight': $scope.userData.weight,
                  'age': $scope.userData.age,
                  'userDataSaved': true};
      CalorieCal.set(info);
    }

    $scope.userDataSaved = function() {
      return CalorieCal.get().userDataSaved == true;
    }
    $scope.options = {
        chart: {
            type: 'multiBarChart',
            width: $window.screen.width - 30,
            height: $window.screen.height - 220,
            margin : {
                top: 20,
                right: 20,
                bottom: 40,
                left: 55
            },
            showControls: false,
            showValues: true,
            stacked: false,
            x: function(d){ return d[0]; },
            y: function(d){ return d[1]; },
            /*
            average: function(d) {
                var vals = d.values.map(function(item){
                    return item[1];
                });
                return d3.mean(vals);
            },
            */

            color: d3.scale.category10().range(),
            // duration: 300,
            useInteractiveGuideline: false,
            // clipVoronoi: false,

            xAxis: {
                axisLabelDistance: 3,
                axisLabel: 'Date',
                tickFormat: function(d) {
                    return d3.time.format('%y-%m-%d')(new Date(d * 1000))
                },
                showMaxMin: false,
                staggerLabels: true
            },
            yAxis: {
              axisLabel: "Number",
              axisLabelDistance: -10
            },
        }
    };

    var moment2Localdate = function(momentObj) {
      return {
        year: momentObj.year(),
        month: momentObj.month() + 1,
        day: momentObj.date(),
      };
    }
    var moment2Timestamp = function(momentObj) {
      return momentObj.unix();
    }

    $scope.data = [];


    $scope.getMetricsHelper = function() {
      if ($scope.uictrl.showRange) {
        $scope.getMetrics('timestamp');
      } else if ($scope.uictrl.showFilter) {
        $scope.getMetrics('local_date');
      } else {
        console.log("Illegal time_type"); // Notice that you need to set query
      }
    }
    $scope.getMetrics = function(mode, metric) {

      if (['local_date', 'timestamp'].indexOf(mode) == -1) {
        console.log('Illegal time_type');
        return;
      }
      $scope.uictrl.current = "Custom";
      $scope.uictrl.showRange = false;
      $scope.uictrl.showFilter = false;
      $scope.uictrl.showVis = true;
      $scope.uictrl.showResult = true;

      var data = {};

      $scope.caloriesData = {};
      $scope.carbonData = {};
      $scope.summaryData = {};
      $scope.caloriesData.userCalories = [];
      $scope.caloriesData.aggrCalories = [];

      $scope.carbonData.userCarbon = [];
      $scope.carbonData.aggrCarbon = [];

      $scope.summaryData.userSummary = [];
      $scope.summaryData.aggrSummary = [];

      if (mode === 'local_date') { // local_date filter
        var tempFrom = $scope.selectCtrl.fromDateLocalDate;
        tempFrom.weekday = $scope.selectCtrl.fromDateWeekdayValue;
        var tempTo = $scope.selectCtrl.toDateLocalDate;
        tempTo.weekday = $scope.selectCtrl.toDateWeekdayValue;
        data = {
          freq: $scope.selectCtrl.freq,
          start_time: tempFrom,
          end_time: tempTo,
          metric: $scope.selectCtrl.metric
        };
      } else if (mode === 'timestamp') { // timestamp range
        var tempFrom = moment2Timestamp($scope.selectCtrl.fromDateTimestamp);
        var tempTo = moment2Timestamp($scope.selectCtrl.toDateTimestamp);
        data = {
          freq: $scope.selectCtrl.pandaFreq,
          start_time: tempFrom,
          end_time: tempTo,
          metric: $scope.selectCtrl.metric
        };
      } else {
        console.log('Illegal mode');
        return;
      }
      console.log("Sending data "+JSON.stringify(data));
      $ionicLoading.show({
        template: 'Loading...'
      });
      var getDuration = function() {
        var clonedData = angular.copy(data);
        clonedData.metric = "duration";
        return CommHelper.getMetrics(mode, data);
      }
      var getSpeed = function() {
        var clonedData = angular.copy(data);
        clonedData.metric = "median_speed";
        return CommHelper.getMetrics(mode, data);
      }
      var getResponse = function() {
        return CommHelper.getMetrics(mode, data);
      }

      var getDistance =  function() {
        var clonedData = angular.copy(data);
        clonedData.metric = "distance";
        return CommHelper.getMetrics(mode, data);
      }
      Promise.all([getDuration, getSpeed, getResponse, getDistance]).then(function(results) {
        // cacheResults(response);
        $ionicLoading.hide();
        if (results[2].user_metrics) {
          $scope.summaryData.userSummary = getSummaryData(results[2].user_metrics, $scope.selectCtrl.metric);
        }
        if (results[2].aggregate_metrics) {
          $scope.summaryData.aggrSummary = getSummaryData(results[2].aggregate_metrics, $scope.selectCtrl.metric);
        }
        $scope.chartDataUser = results[2].user_metrics? results[2].user_metrics : [];
        $scope.chartDataAggr = results[2].aggregate_metrics? results[2].aggregate_metrics : [];

        if (results[0].user_metrics) {
          var durationData = getSummaryDataRaw(results[0].user_metrics, "duration");
        }
        if (results[1].user_metrics) {
          var speedData = getSummaryDataRaw(results[1].user_metrics, "median_speed");
        }
        for (var i in durationData) {
          if ($scope.userDataSaved()) {
            var userDataFromStorage = CalorieCal.get();
            var met = CalorieCal.getMet(durationData[i].key, speedData[i].values);
            var gender = userDataFromStorage.gender;
            var heightUnit = userDataFromStorage.heightUnit;
            var height = userDataFromStorage.height;
            var weightUnit = userDataFromStorage.weightUnit;
            var weight = userDataFromStorage.weight;
            var age = userDataFromStorage.age;
            met = CalorieCal.getCorrectedMet(met, gender, age, height, heightUnit, weight, weightUnit);
          } else {
            var met = CalorieCal.getMet(durationData[i].key, speedData[i].values);
          }
          $scope.caloriesData.userCalories.push({
            key: durationData[i].key,
            values: Math.round(CalorieCal.getuserCalories(durationData[i].values / 3600, met)) + ' cal'
          })
        }

        if (results[0].aggregate_metrics) {
          var avgDurationData = getAvgSummaryDataRaw(results[0].aggregate_metrics, "duration");
        }
        if (results[1].aggregate_metrics) {
          var avgSpeedData = getAvgSummaryDataRaw(results[1].aggregate_metrics, "median_speed");
        }
        for (var i in avgDurationData) {

          var met = CalorieCal.getMet(avgDurationData[i].key, avgSpeedData[i].values);

          $scope.caloriesData.aggrCalories.push({
            key: avgDurationData[i].key,
            values: Math.round(CalorieCal.getuserCalories(avgDurationData[i].values / 3600, met)) + ' cal'
          })
        }


        var defaultCarFootprint = 278.0/1609; // kg CO2 per meter
        var defaultTrainFootprint = 92.0/1609; // kg CO2 per meter

        if (results[3].user_metrics) {
          var userCarbonData = getSummaryDataRaw(results[3].user_metrics, 'distance');
          $scope.carbonData.userCarbon = [];
          for (var i in userCarbonData) {
            $scope.carbonData.userCarbon.push({key: userCarbonData[i].key, values: FootprintHelper.getFootprint(userCarbonData[i].values, userCarbonData[i].key)});
            if (userCarbonData[i].key === "IN_VEHICLE") {
              $scope.carbonData.userVehicleRange = FootprintHelper.getFootprintRaw(userCarbonData[i].values, userCarbonData[i].key);
            }
          }
        }
        if (results[3].aggregate_metrics) {
          var aggrCarbonData = getAvgSummaryDataRaw(results[3].aggregate_metrics, 'distance');
          $scope.carbonData.aggrCarbon = [];
          for (var i in aggrCarbonData) {
            $scope.carbonData.aggrCarbon.push({key: aggrCarbonData[i].key, values: FootprintHelper.getFootprint(aggrCarbonData[i].values, aggrCarbonData[i].key)});
            if (aggrCarbonData[i].key === "IN_VEHICLE") {
              $scope.carbonData.aggrVehicleRange = FootprintHelper.getFootprintRaw(aggrCarbonData[i].values, aggrCarbonData[i].key);
            }
          }
        }

        if (angular.isDefined($scope.uictrl.showMe? $scope.chartDataUser: $scope.chartDataAggr)) {
          $scope.$apply(function() {
            $scope.showCharts($scope.uictrl.showMe? $scope.chartDataUser: $scope.chartDataAggr);
            $scope.summaryData.defaultSummary = $scope.uictrl.showMe? $scope.summaryData.userSummary : $scope.summaryData.aggrSummary;
            $scope.caloriesData.defaultCalories = $scope.uictrl.showMe? $scope.caloriesData.userCalories : $scope.caloriesData.aggrCalories;
            $scope.carbonData.defaultCarbon = $scope.uictrl.showMe? $scope.carbonData.userCarbon : $scope.carbonData.aggrCarbon;
            $scope.carbonData.defaultVehicleRange = $scope.uictrl.showMe? $scope.carbonData.userVehicleRange : $scope.carbonData.aggrVehicleRange;
            $scope.getCarbonGoalChartData();

            $scope.modeTitle = $scope.selectCtrl.metric === "median_speed"? "(Average)" : "(Total)";
            $scope.caloriesTitle = "(Average)";
            $scope.footprintTitle = "(Average)";
          })
        } else {
          $scope.$apply(function() {
            $scope.showCharts([]);
            console.log("did not find aggregate result in response data "+JSON.stringify(results[2]));

            $scope.summaryData.defaultSummary = $scope.uictrl.showMe? $scope.summaryData.userSummary : $scope.summaryData.aggrSummary;
            $scope.caloriesData.defaultCalories = $scope.uictrl.showMe? $scope.caloriesData.userCalories : $scope.caloriesData.aggrCalories;
            $scope.carbonData.defaultCarbon = $scope.uictrl.showMe? $scope.carbonData.userCarbon : $scope.carbonData.aggrCarbon;
            $scope.carbonData.defaultVehicleRange = $scope.uictrl.showMe? $scope.carbonData.userVehicleRange : $scope.carbonData.aggrVehicleRange;
            $scope.getCarbonGoalChartData();

            $scope.modeTitle = $scope.selectCtrl.metric === "median_speed"? "(Average)" : "(Total)";
            $scope.caloriesTitle = "(Average)";
            $scope.footprintTitle = "(Average)";
          });
        }
      });
    };

    $scope.showCharts = function(agg_metrics) {
      $scope.data = getDataFromMetrics(agg_metrics);

        var metricLabelMap = {
           "COUNT":'Number',
           "DISTANCE": 'm',
           "DURATION": 'secs',
           "MEDIAN_SPEED": 'm/sec'
        };

        $scope.options.chart.yAxis.axisLabel = metricLabelMap[$scope.selectCtrl.metricString];
    };
    $scope.pandaFreqOptions = [
      {text: "DAILY", value: 'D'},
      {text: "WEEKLY", value: 'W'},
      {text: "BIWEEKLY", value: '2W'},
      {text: "MONTHLY", value: 'M'},
      {text: "YEARLY", value: 'A'}
    ];

    $scope.metricOptions = [
      {text: "COUNT", value:'count'},
      {text: "DISTANCE", value: 'distance'},
      {text: "DURATION", value: 'duration'},
      {text: "MEDIAN_SPEED", value: 'median_speed'}
    ];

    $scope.freqOptions = [
      {text: "DAILY", value:'DAILY'},
      {text: "MONTHLY", value: 'MONTHLY'},
      {text: "YEARLY", value: 'YEARLY'}
    ];
    var getAvgDataFromMetrics = function(metrics) {
        var mode_bins = {};
        var nUsers = 0;
        metrics.forEach(function(metric) {
            for (var field in metric) {
                // TODO: Consider creating a prefix such as M_ to signal
                // modes. Is that really less fragile than caps, though?
                // Here, we check if the string is all upper case by
                // converting it to upper case and seeing if it is changed
                if (field == field.toUpperCase()) {
                    if (field === "WALKING" || field === "RUNNING") {
                      field = "ON_FOOT";
                    }
                    if (field in mode_bins == false) {
                        mode_bins[field] = []
                    }
                    mode_bins[field].push([metric.ts, Math.round(metric[field] / metric.nUsers), metric.fmt_time]);
                }
            }
        });
        var rtn = [];
        for (var mode in mode_bins) {
          var val_arrays = rtn.push({key: mode, values: mode_bins[mode]});
        }
        return rtn;
    }

    var getDataFromMetrics = function(metrics) {
        var mode_bins = {};
        metrics.forEach(function(metric) {
            for (var field in metric) {
                // TODO: Consider creating a prefix such as M_ to signal
                // modes. Is that really less fragile than caps, though?
                // Here, we check if the string is all upper case by
                // converting it to upper case and seeing if it is changed
                if (field == field.toUpperCase()) {
                    if (field === "WALKING" || field === "RUNNING") {
                      field = "ON_FOOT";
                    }
                    if (field in mode_bins == false) {
                        mode_bins[field] = []
                    }
                    mode_bins[field].push([metric.ts, metric[field], metric.fmt_time]);
                }
            }
        });
        var rtn = [];
        for (var mode in mode_bins) {
          var val_arrays = rtn.push({key: mode, values: mode_bins[mode]});
        }
        return rtn;
    }
    var getSummaryDataRaw = function(metrics, metric) {
        var data = getDataFromMetrics(metrics);
        for (var i = 0; i < data.length; i++) {
          var temp = 0;
          for (var j = 0; j < data[i].values.length; j++) {
            temp += data[i].values[j][1];
          }
          if (metric === "median_speed") {
            data[i].values = Math.round(temp / data[i].values.length);
          } else {
            data[i].values = Math.round(temp);
          }

        }
        return data;
    }
    var getAvgSummaryDataRaw = function(metrics, metric) {
        var data = getAvgDataFromMetrics(metrics);
        for (var i = 0; i < data.length; i++) {
          var temp = 0;
          for (var j = 0; j < data[i].values.length; j++) {
            temp += data[i].values[j][1];
          }
          if (metric === "median_speed") {
            data[i].values = Math.round(temp / data[i].values.length);
          } else {
            data[i].values = Math.round(temp);
          }

        }
        return data;
    }
    var getSummaryData = function(metrics, metric) {
        var data = getDataFromMetrics(metrics);
        for (var i = 0; i < data.length; i++) {
          var temp = 0;
          for (var j = 0; j < data[i].values.length; j++) {
            temp += data[i].values[j][1];
          }
          var unit = "";
          switch(metric) {
            case "count":
              unit = "trips";
              break;
            case "distance":
              unit = "m";
              break;
            case "duration":
              unit = "s";
              break;
            case "median_speed":
              unit = "m/s";
              break;
          }
          if (metric === "median_speed") {
            data[i].values = Math.round(temp / data[i].values.length  ) + ' ' + unit;
          } else {
            data[i].values = Math.round(temp) + ' ' + unit;
          }

        }
        return data;
    }

    $scope.changeFromWeekday = function() {
      return $scope.changeWeekday(function(newVal) {
                                    $scope.selectCtrl.fromDateWeekdayString = newVal;
                                  },
                                  'from');
    }

    $scope.changeToWeekday = function() {
      return $scope.changeWeekday(function(newVal) {
                                    $scope.selectCtrl.toDateWeekdayString = newVal;
                                  },
                                  'to');
    }

    // $scope.show fil

    $scope.changeWeekday = function(stringSetFunction, target) {
      var weekdayOptions = [
        {text: "All", value: null},
        {text: "Monday", value: 0},
        {text: "Tuesday", value: 1},
        {text: "Wednesday", value: 2},
        {text: "Thursday", value: 3},
        {text: "Friday", value: 4},
        {text: "Saturday", value: 5},
        {text: "Sunday", value: 6}
      ];
      $ionicActionSheet.show({
        buttons: weekdayOptions,
        titleText: "Select day of the week",
        cancelText: "Cancel",
        buttonClicked: function(index, button) {
          stringSetFunction(button.text);
          if (target === 'from') {
            $scope.selectCtrl.fromDateWeekdayValue = button.value;
          } else if (target === 'to') {
            $scope.selectCtrl.toDateWeekdayValue = button.value;
          } else {
            console.log("Illegal target");
          }
          return true;
        }
      });
    };


    $scope.changeMetric = function() {
        $ionicActionSheet.show({
          buttons: $scope.metricOptions,
          titleText: "Select metric",
          cancelText: "Cancel",
          buttonClicked: function(index, button) {
            $scope.selectCtrl.metricString = button.text;
            $scope.selectCtrl.metric = button.value;
            return true;
          }
        });
    };

    $scope.changeFreq = function() {
        $ionicActionSheet.show({
          buttons: $scope.freqOptions,
          titleText: "Select summary freqency",
          cancelText: "Cancel",
          buttonClicked: function(index, button) {
            $scope.selectCtrl.freqString = button.text;
            $scope.selectCtrl.freq = button.value;
            return true;
          }
        });
    };

    $scope.changePandaFreq = function() {
        $ionicActionSheet.show({
          buttons: $scope.pandaFreqOptions,
          titleText: "Select summary freqency",
          cancelText: "Cancel",
          buttonClicked: function(index, button) {
            $scope.selectCtrl.pandaFreqString = button.text;
            $scope.selectCtrl.pandaFreq = button.value;
            return true;
          }
        });
    };
    $scope.getDefaultCarboGoalCharData = function() {
      var lower = 0;
      var upper = 100;
      $scope.carbonGoalChartData = { // first elem: absolute left or right distance, second elem: number
        min: [2, lower], // 2 for offset padding
        max: [2, upper],
      }     
    }
    $scope.getDefaultCarboGoalCharData();
    $scope.getCarbonGoalChartData = function() {
      var date1 = $scope.selectCtrl.fromDateTimestamp;
      var date2 = $scope.selectCtrl.toDateTimestamp;
      var duration = moment.duration(date2.diff(date1));
      var days = duration.asDays();



      var lower = $scope.carbonData.defaultVehicleRange[0];
      var upper = $scope.carbonData.defaultVehicleRange[1];
      var ca2020 = 43.771628 / 5 * days; // kg/day
      var ca2035 = 40.142892 / 5 * days; // kg/day
      var temp2020offset = Math.round((ca2020 - lower) / (upper - lower) * 100);
      temp2020offset = temp2020offset > 100? 98 : temp2020offset < 0? 2 : temp2020offset;
      var temp2035offset = Math.round((ca2035 - lower) / (upper - lower) * 100);
      temp2035offset = temp2035offset > 100? 98 : temp2035offset < 0? 2 : temp2035offset;
      $scope.carbonGoalChartData = { // first elem: absolute left or right distance, second elem: number
        min: [2, lower], // 2 for offset padding
        max: [2, upper],
        ca2020: [temp2020offset, ca2020],
        ca2035: [temp2035offset, ca2035]

      };
      $scope.showca2020 = false;
      $scope.showca2035 = false;

    }
    $scope.shouldshowca2020 = function() {
      return $scope.showca2020;
    }
    $scope.shouldshowca2035 = function() {
      return $scope.showca2035;
    }
    $scope.toggleca2020 = function() {
      $scope.showca2020 = !$scope.showca2020;
    }
    $scope.toggleca2035 = function() {
      $scope.showca2035 = !$scope.showca2035;
    }
    $scope.toggle = function() {
      if (!$scope.uictrl.showMe) {
        $scope.uictrl.showMe = true;
        $scope.showCharts($scope.chartDataUser);
        $scope.summaryData.defaultSummary = $scope.summaryData.userSummary;
        $scope.caloriesData.defaultCalories = $scope.caloriesData.userCalories;
        $scope.carbonData.defaultCarbon = $scope.carbonData.userCarbon;
        $scope.carbonData.defaultVehicleRange =  $scope.carbonData.userVehicleRange;
        $scope.getCarbonGoalChartData();

      } else {
        $scope.uictrl.showMe = false;
        $scope.showCharts($scope.chartDataAggr);
        $scope.summaryData.defaultSummary = $scope.summaryData.aggrSummary;
        $scope.caloriesData.defaultCalories = $scope.caloriesData.aggrCalories;
        $scope.carbonData.defaultCarbon = $scope.carbonData.aggrCarbon;
        $scope.carbonData.defaultVehicleRange =  $scope.carbonData.aggrVehicleRange;
        $scope.getCarbonGoalChartData();
      }
    }
    var initSelect = function() {
      var now = moment();
      var monthago = moment().subtract(7, 'd');
      $scope.selectCtrl.metric = 'count';
      $scope.selectCtrl.metricString = "COUNT";
      $scope.selectCtrl.freq = 'DAILY';
      $scope.selectCtrl.freqString = "DAILY";
      $scope.selectCtrl.pandaFreq = 'D';
      $scope.selectCtrl.pandaFreqString = "DAILY";
      // local_date saved as localdate
      $scope.selectCtrl.fromDateLocalDate = moment2Localdate(monthago);
      $scope.selectCtrl.toDateLocalDate = moment2Localdate(now);
      // ts saved as moment
      $scope.selectCtrl.fromDateTimestamp= monthago;
      $scope.selectCtrl.toDateTimestamp = now;

      $scope.selectCtrl.fromDateWeekdayString = "All"
      $scope.selectCtrl.toDateWeekdayString = "All"

      $scope.selectCtrl.fromDateWeekdayValue = null;
      $scope.selectCtrl.toDateWeekdayValue = null;

      $scope.selectCtrl.region = null;
    };


  $scope.selectCtrl = {}
  initSelect();

  $scope.modeIcon = function(key) {
    var icons = {"BICYCLING":"ion-android-bicycle",
    "ON_FOOT":" ion-android-walk",
    "IN_VEHICLE":"ion-speedometer",
    "UNKNOWN": "ion-ios-help"}
    return icons[key];
  }

  $scope.setCurDayFrom = function(val) {
    if (val) {
      $scope.selectCtrl.fromDateTimestamp = moment(val);
      $scope.datepickerObjFrom.inputDate = val;
    } else {
      $scope.datepickerObjFrom.inputDate = $scope.selectCtrl.fromDateTimestamp.toDate();
    }

  };
  $scope.setCurDayTo = function(val) {
    if (val) {
      $scope.selectCtrl.toDateTimestamp = moment(val);
      $scope.datepickerObjTo.inputDate = val;
    } else {
      $scope.datepickerObjTo.inputDate = $scope.selectCtrl.toDateTimestamp.toDate();
    }

  };


  $scope.data = {};

  $scope.userData = {
    gender: -1,
    heightUnit: 1,
    weightUnit: 1
  };
  $scope.caloriePopup = function() {
    $ionicPopup.show({
      templateUrl: 'templates/caloriePopup.html',
      title: '',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Confirm</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!($scope.userData.gender != -1 && $scope.userData.age && $scope.userData.weight && $scope.userData.height)) {
              e.preventDefault();
            } else {
              $scope.storeUserData();
              // refresh
            }
          }
        }
      ]
    });
  }
  $scope.datepickerObjFrom = {
      callback: $scope.setCurDayFrom,
      inputDate: $scope.selectCtrl.fromDateTimestamp.toDate(),
      setLabel: 'Set',
      todayLabel: 'Today',
      closeLabel: 'Close',
      mondayFirst: false,
      weeksList: ["S", "M", "T", "W", "T", "F", "S"],
      monthsList: ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
      templateType: 'popup',
      from: new Date(2015, 1, 1),
      to: new Date(),
      showTodayButton: true,
      dateFormat: 'MMMM dd yyyy',
      closeOnSelect: false,
      disableWeekdays: [6]
    };
  $scope.datepickerObjTo = {
      callback: $scope.setCurDayTo,
      inputDate: $scope.selectCtrl.toDateTimestamp.toDate(),
      setLabel: 'Set',
      todayLabel: 'Today',
      closeLabel: 'Close',
      mondayFirst: false,
      weeksList: ["S", "M", "T", "W", "T", "F", "S"],
      monthsList: ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
      templateType: 'popup',
      from: new Date(2015, 1, 1),
      to: new Date(),
      showTodayButton: true,
      dateFormat: 'MMMM dd yyyy',
      closeOnSelect: false,
      disableWeekdays: [6]
    };

});