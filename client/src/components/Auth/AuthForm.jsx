// AuthForm.js
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthForm = ({ isLogin }) => {
  const { login } = useAuth();  // Access the `login` function from AuthContext
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    username: Yup.string()
      .required('Username is required')
      .matches(/^[a-zA-Z0-9_.]+$/, 'Invalid characters in username'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters'),
    ...(!isLogin && {
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required')
    })
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        const endpoint = isLogin ? '/api/login' : '/api/signup';
        const body = isLogin ? {
          username: values.username,
          password: values.password
        } : values;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          credentials: 'include'
        });

        const data = await response.json(); // This is where the data (user) comes from

        if (!response.ok) {
          throw new Error(data.error || 'Something went wrong');
        }

        // Pass the returned user data to the login function
        login(data);  // This will update the user in the AuthContext
        navigate('/dashboard'); // Navigate to the home page or another page
      } catch (error) {
        setErrors({ submit: error.message });
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      {!isLogin && (
        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            {...formik.getFieldProps('email')}
          />
          {formik.touched.email && formik.errors.email && (
            <div>{formik.errors.email}</div>
          )}
        </div>
      )}

      <div>
        <label>Username</label>
        <input
          name="username"
          {...formik.getFieldProps('username')}
        />
        {formik.touched.username && formik.errors.username && (
          <div>{formik.errors.username}</div>
        )}
      </div>

      <div>
        <label>Password</label>
        <input
          name="password"
          type="password"
          {...formik.getFieldProps('password')}
        />
        {formik.touched.password && formik.errors.password && (
          <div>{formik.errors.password}</div>
        )}
      </div>

      {formik.errors.submit && (
        <div className="error">{formik.errors.submit}</div>
      )}

      <button type="submit" disabled={formik.isSubmitting}>
        {isLogin ? 'Login' : 'Sign Up'}
      </button>
    </form>
  );
};

export default AuthForm;