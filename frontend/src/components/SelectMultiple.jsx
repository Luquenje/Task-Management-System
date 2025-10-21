import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import PropTypes from 'prop-types';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(option, selectedValues, theme) {
  return {
    fontWeight: selectedValues.includes(option)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select options',
  label,
  width = 300,
  sx = {},
  disabled = false,
}) {
  const theme = useTheme();

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    // onChange(typeof value === 'string' ? value.split(',') : value);
    onChange(event)
  };

  return (
    <FormControl sx={{ m: 1, width, ...sx }} disabled={disabled} size="small">
      {label && <label style={{ marginBottom: 4 }}>{label}</label>}
      <Select
        multiple
        displayEmpty
        value={value}
        onChange={handleChange}
        input={<OutlinedInput />}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <em>{placeholder}</em>;
          }
          return selected.join(', ');
        }}
        MenuProps={MenuProps}
        inputProps={{ 'aria-label': label || 'multiple select' }}
      >
        <MenuItem disabled value="">
          <em>{placeholder}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={option}
            value={option}
            style={getStyles(option, value, theme)}
          >
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// ✅ Type checking (optional but good practice)
MultiSelect.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  sx: PropTypes.object,
  disabled: PropTypes.bool,
};
