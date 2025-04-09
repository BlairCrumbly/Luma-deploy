import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';

const CustomSizeCalendar = ({ startDate, endDate, values }) => {
  return (
    <div className="custom-calendar-wrapper">
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={(value) => {
          if (!value) {
            return 'color-empty';
          }
          return `color-scale-${Math.min(value.count, 4)}`;
        }}
        tooltipDataAttrs={(value) => {
          if (!value || !value.date) {
            return null;
          }
          return {
            'data-tip': `${value.date}: ${value.count} entries`,
          };
        }}
        showMonthLabels={false}
        gutterSize={3}
        showWeekdayLabels={true}
        transformDayElement={(element, value, index) => {
          // You can transform individual day elements here if needed
          return React.cloneElement(element);
        }}
      />
    </div>
  );
};

// Then in your HomePage component, use:
// <CustomSizeCalendar 
//   startDate={getStartDate()} 
//   endDate={getEndDate()} 
//   values={entriesHeatmap} 
// />