# var myEl = document.querySelector('seed-element');

#       suite('<seed-element>', function() {

#         test('defines the "author" property', function() {
#           assert.equal(myEl.author.name, 'Dimitri Glazkov');
#           assert.equal(myEl.author.image, 'http://addyosmani.com/blog/wp-content/uploads/2013/04/unicorn.jpg');
#         });

#         test('says hello', function() {
#           assert.equal(myEl.sayHello(), 'seed-element says, Hello World!');

#           var greetings = myEl.sayHello('greetings Earthlings');
#           assert.equal(greetings, 'seed-element says, greetings Earthlings');
#         });

#         test('fires lasers', function(done) {
#           myEl.addEventListener('seed-element-lasers', function(event) {
#             assert.equal(event.detail.sound, 'Pew pew!');
#             done();
#           });
#           myEl.fireLasers();
#         });

#       });

suite 'test test', () ->
  test 'tests work', () ->
    assert.equal true, true
    assert.equal false, true