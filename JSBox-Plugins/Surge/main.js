const app = require('scripts/app');
const today = require('scripts/today');

$app.autoKeyboardEnabled = true;

if ($app.env === $env.today) {
    app.renderUI();
} else {
    app.renderUI();
}